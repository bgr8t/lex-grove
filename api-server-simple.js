import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import admin from 'firebase-admin';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
  } catch (error) {
    console.error('Failed to initialize Firebase Admin:', error);
  }
}

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, '/tmp'); // Use system temp directory
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'pdf-' + uniqueSuffix + '.pdf');
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  }
});

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

// Parse JSON for most routes (but not for file upload routes)
app.use('/api', (req, res, next) => {
  if (req.path === '/summarize-brief') {
    // Skip JSON parsing for file upload
    next();
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});

/**
 * Sanitize and validate the response from Gemini
 */
function sanitizeResponse(data) {
  return {
    title: sanitizeString(data.title || '', 200),
    facts: sanitizeString(data.facts || '', 8000),
    issue: sanitizeString(data.issue || '', 4000),
    rule: sanitizeString(data.rule || '', 5000),
    analysis: sanitizeString(data.analysis || '', 8000),
    conclusion: sanitizeString(data.conclusion || '', 4000),
    tags: Array.isArray(data.tags) 
      ? data.tags.slice(0, 8).map(t => sanitizeString(String(t), 30)).filter(Boolean)
      : []
  };
}

/**
 * Sanitize string input by removing null bytes and limiting length
 */
function sanitizeString(input, maxLength) {
  return input
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
    .slice(0, maxLength)
    .trim();
}

// Simple route to test server is working
app.get('/api/test', (req, res) => {
  res.json({ message: 'API server is running', timestamp: new Date().toISOString() });
});

// PDF summarization endpoint
app.post('/api/summarize-brief', upload.single('pdf'), async (req, res) => {
  let tempFilePath = null;

  try {
    // Check if Gemini API key is configured
      if (!process.env.GEMINI_API_KEY || !genAI) {
    console.error('GEMINI_API_KEY environment variable not set');
      return res.status(500).json({ error: 'AI service not configured' });
    }

    // Authenticate the user
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    let userId;
    try {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await admin.auth().verifyIdToken(token);
      userId = decodedToken.uid;
    } catch (error) {
      console.error('Authentication failed:', error);
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ error: 'No PDF file uploaded or invalid file type' });
    }

    tempFilePath = req.file.path;

    // Validate file size (additional check)
    const stats = fs.statSync(tempFilePath);
    if (stats.size > 10 * 1024 * 1024) {
      return res.status(413).json({ error: 'File too large. Maximum size is 10MB.' });
    }

    // Read the PDF file
    const pdfData = fs.readFileSync(tempFilePath);
    
    // Initialize Gemini model
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash',
      generationConfig: {
        temperature: 0.2,
        topP: 0.8,
        topK: 40,
      }
    });

    const prompt = `You are a legal assistant tasked with analyzing this legal case PDF and extracting information to create a comprehensive case brief using the IRAC method.

Please analyze the document and extract the following information:

1. **Title**: The case name/title (e.g., "Plaintiff v. Defendant")
2. **Facts**: The relevant facts of the case that are material to the legal issues
3. **Issue**: The specific legal question(s) or problem(s) presented in the case
4. **Rule**: The applicable legal rule, principle, statute, or precedent that applies
5. **Analysis**: How the court applied the legal rule to the specific facts of the case
6. **Conclusion**: The court's decision, holding, or outcome
7. **Tags**: 3-8 relevant legal topic tags (e.g., "contract law", "negligence", "constitutional law")

IMPORTANT INSTRUCTIONS:
- Focus on legal substance, not procedural details
- Be concise but comprehensive in your analysis
- Only extract information that is actually present in the document
- If any section cannot be determined from the document, use a brief explanatory note
- Return your response as a valid JSON object with the exact structure shown below

Return ONLY a JSON object with this exact structure:
{
  "title": "Case name/title from the document",
  "facts": "Relevant material facts of the case",
  "issue": "Legal question(s) presented", 
  "rule": "Applicable legal rule/principle/statute",
  "analysis": "Court's reasoning and application of rule to facts",
  "conclusion": "Court's decision/holding/outcome",
  "tags": ["tag1", "tag2", "tag3", "tag4"]
}`;

    // Send the PDF to Gemini for processing
    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: pdfData.toString('base64'),
          mimeType: 'application/pdf'
        }
      }
    ]);

    const responseText = result.response.text();
    
    if (!responseText) {
      throw new Error('No response from AI model');
    }

    // Clean the JSON response (remove code block markers if present)
    const cleanJson = responseText
      .replace(/```json\n?|\n?```/g, '')
      .replace(/```\n?|\n?```/g, '')
      .trim();

    let briefData;
    try {
      briefData = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      console.error('Raw response:', responseText);
      throw new Error('AI returned invalid response format');
    }

    // Validate and sanitize the response
    const sanitizedData = sanitizeResponse(briefData);

    // Validate that we have at least some content
    if (!sanitizedData.title && !sanitizedData.facts && !sanitizedData.issue) {
      throw new Error('Unable to extract meaningful case brief information from the PDF');
    }

    // Log successful processing (without sensitive data)
    console.log(`PDF successfully processed for user ${userId}, extracted ${sanitizedData.title || 'untitled case'}`);

    res.status(200).json(sanitizedData);

  } catch (error) {
    console.error('PDF summarization error:', error.message);
    
    // Return appropriate error messages
    if (error.message?.includes('quota')) {
      res.status(429).json({ error: 'AI service temporarily unavailable. Please try again later.' });
    } else if (error.message?.includes('parse')) {
      res.status(422).json({ error: 'Unable to process this PDF. Please try a different file.' });
    } else if (error.message?.includes('size') || error.message?.includes('large')) {
      res.status(413).json({ error: 'File too large. Please upload a smaller PDF.' });
    } else {
      res.status(500).json({ error: 'Failed to process PDF. Please try again.' });
    }
  } finally {
    // Clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (cleanupError) {
        console.error('Failed to clean up temporary file:', cleanupError);
      }
    }
  }
});

// Catch-all for other API routes
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: `API route ${req.path} not found` });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Express error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
  console.log(`CORS enabled for: http://localhost:5173`);
  console.log(`Gemini AI configured: ${!!process.env.GEMINI_API_KEY}`);
});

export default app;