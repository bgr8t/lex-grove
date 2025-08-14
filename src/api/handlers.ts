import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { CaseBrief } from '../lib/models/caseBrief';
import { GoogleGenerativeAI } from '@google/generative-ai';
import multer from 'multer';
import fs from 'fs';

const db = getFirestore();

export const searchHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const query = (req.query.q as string) || '';
        const filter = (req.query.filter as string) || 'all';
        const sort = (req.query.sort as string) || 'relevant';
        const limit = parseInt(req.query.limit as string) || 10;
        const page = parseInt(req.query.page as string) || 1;
        const offset = (page - 1) * limit;

        let accessLevel = 'public';

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split('Bearer ')[1];
                const decodedToken = await admin.auth().verifyIdToken(token);

                const userDoc = await db.collection('userProfiles').doc(decodedToken.uid).get();
                const userData = userDoc.data();

                if (userData) {
                    if (userData.membershipStatus === 'premium' || userData.membershipStatus === 'contributor') {
                        accessLevel = 'premium';
                    } else {
                        accessLevel = 'authenticated';
                    }

                    if (userData.role === 'admin') {
                        accessLevel = 'admin';
                    }
                } else {
                    accessLevel = 'authenticated';
                }
            } catch (err) {
                console.error('Error verifying auth token:', err);
            }
        }

        let queryRef: admin.firestore.Query = db.collection('caseBriefs');

        if (query) {
            const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 0);
            if (searchTerms.length > 0) {
                queryRef = queryRef.where('searchableIndex', 'array-contains-any', searchTerms);
            }
        }

        const totalResultsSnapshot = await queryRef.get();
        const totalResults = totalResultsSnapshot.size;

        queryRef = queryRef.orderBy(sort === 'recent' ? 'createdAt' : 'viewCount', 'desc')
            .offset(offset)
            .limit(limit);

        const briefsSnapshot = await queryRef.get();

        const results = briefsSnapshot.docs.map(doc => {
            const brief = { id: doc.id, ...doc.data() } as CaseBrief;
            if (accessLevel === 'premium' || accessLevel === 'admin') {
                return brief;
            } else if (accessLevel === 'authenticated') {
                return {
                    id: brief.id,
                    title: brief.title,
                    court: brief.court,
                    date: brief.date,
                    citation: brief.citation,
                    factsPreview: brief.facts ? brief.facts.substring(0, 150) + '...' : '',
                    issuePreview: brief.issue ? brief.issue.substring(0, 150) + '...' : '',
                    holdingPreview: brief.holding ? brief.holding.substring(0, 150) + '...' : '',
                    viewCount: brief.viewCount,
                    createdAt: brief.createdAt
                };
            } else {
                return {
                    id: brief.id,
                    title: brief.title,
                    court: brief.court,
                    date: brief.date,
                    factsPreview: brief.facts ? brief.facts.substring(0, 100) + '...' : '',
                    viewCount: brief.viewCount,
                    createdAt: brief.createdAt
                };
            }
        });

        res.json({
            query,
            accessLevel,
            totalResults,
            page,
            limit,
            results
        });
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'An error occurred while searching' });
    }
};

export const getBriefHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const briefId = req.params.id;
        let accessLevel = 'public';
        let userId = null;

        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            try {
                const token = authHeader.split('Bearer ')[1];
                const decodedToken = await admin.auth().verifyIdToken(token);
                userId = decodedToken.uid;
                const userDoc = await db.collection('userProfiles').doc(decodedToken.uid).get();
                const userData = userDoc.data();
                if (userData) {
                    if (userData.membershipStatus === 'premium' || userData.membershipStatus === 'contributor') {
                        accessLevel = 'premium';
                    } else {
                        accessLevel = 'authenticated';
                    }
                    if (userData.role === 'admin') {
                        accessLevel = 'admin';
                    }
                } else {
                    accessLevel = 'authenticated';
                }
            } catch (err) {
                console.error('Error verifying auth token:', err);
            }
        }

        const briefRef = db.collection('caseBriefs').doc(briefId);
        const briefDoc = await briefRef.get();

        if (briefDoc.exists) {
            const brief = { id: briefDoc.id, ...briefDoc.data() } as CaseBrief;
            let filteredBrief: any = {};
            if (accessLevel === 'premium' || accessLevel === 'admin' || (brief.userId === userId)) {
                filteredBrief = brief;
            } else if (accessLevel === 'authenticated') {
                filteredBrief = {
                    id: brief.id,
                    title: brief.title,
                    court: brief.court,
                    date: brief.date,
                    citation: brief.citation,
                    factsPreview: brief.facts ? brief.facts.substring(0, 150) + '...' : '',
                    issuePreview: brief.issue ? brief.issue.substring(0, 150) + '...' : '',
                    holdingPreview: brief.holding ? brief.holding.substring(0, 150) + '...' : '',
                    viewCount: brief.viewCount,
                    createdAt: brief.createdAt
                };
            } else {
                filteredBrief = {
                    id: brief.id,
                    title: brief.title,
                    court: brief.court,
                    date: brief.date,
                    factsPreview: brief.facts ? brief.facts.substring(0, 100) + '...' : '',
                    viewCount: brief.viewCount,
                    createdAt: brief.createdAt
                };
            }
            res.json(filteredBrief);
        } else {
            res.status(404).json({ error: 'Brief not found' });
        }
    } catch (error) {
        console.error('Error getting brief:', error);
        res.status(500).json({ error: 'An error occurred while fetching the brief' });
    }
};

export const createBriefHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, court, citation, date, facts, issue, holding, reasoning, notes, keywords, summary } = req.body;
        const userId = (req as any).user.uid;
        const newBrief = {
            title, court, citation, date, facts, issue, holding, reasoning, notes, keywords, summary,
            userId,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            viewCount: 0,
        };
        const briefRef = await db.collection('caseBriefs').add(newBrief);
        res.status(201).json({ id: briefRef.id, ...newBrief });
    } catch (error) {
        console.error('Error creating brief:', error);
        res.status(500).json({ error: 'An error occurred while creating the brief' });
    }
};

export const updateBriefHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const briefId = req.params.id;
        const userId = (req as any).user.uid;
        const briefRef = db.collection('caseBriefs').doc(briefId);
        const briefDoc = await briefRef.get();
        if (!briefDoc.exists) {
            res.status(404).json({ error: 'Brief not found' });
            return;
        }
        const brief = briefDoc.data();
        if (brief.userId !== userId && !(req as any).user.isAdmin) {
            res.status(403).json({ error: 'Permission denied' });
            return;
        }
        await briefRef.update(req.body);
        res.status(200).json({ id: briefId, ...req.body });
    } catch (error) {
        console.error('Error updating brief:', error);
        res.status(500).json({ error: 'An error occurred while updating the brief' });
    }
};

export const deleteBriefHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const briefId = req.params.id;
        const userId = (req as any).user.uid;
        const briefRef = db.collection('caseBriefs').doc(briefId);
        const briefDoc = await briefRef.get();
        if (!briefDoc.exists) {
            res.status(404).json({ error: 'Brief not found' });
            return;
        }
        const brief = briefDoc.data();
        if (brief.userId !== userId && !(req as any).user.isAdmin) {
            res.status(403).json({ error: 'Permission denied' });
            return;
        }
        await briefRef.delete();
        res.status(204).send();
    } catch (error) {
        console.error('Error deleting brief:', error);
        res.status(500).json({ error: 'An error occurred while deleting the brief' });
    }
};

export const getProfileHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.uid;
        const userProfileRef = db.collection('userProfiles').doc(userId);
        const doc = await userProfileRef.get();
        if (!doc.exists) {
            res.status(404).json({ error: 'User profile not found' });
            return;
        }
        res.json(doc.data());
    } catch (error) {
        console.error('Error getting profile:', error);
        res.status(500).json({ error: 'An error occurred while fetching the profile' });
    }
};

export const updateProfileHandler = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req as any).user.uid;
        const { university, legalField, interests } = req.body;
        const userProfileRef = db.collection('userProfiles').doc(userId);
        await userProfileRef.set({
            university,
            legalField,
            interests,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
        res.status(200).json({ message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'An error occurred while updating the profile' });
    }
};

export const csrfTokenHandler = (req: Request, res: Response): void => {
    res.json({ status: 'success' });
};

export const adminDashboardHandler = (req: Request, res: Response): void => {
    res.json({
        message: 'Welcome to the admin dashboard!',
        timestamp: new Date().toISOString()
    });
};

// Configure multer for PDF uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '/tmp'); // Use system temp directory
    },
    filename: function (req, file, cb) {
        // Generate unique filename
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

// Initialize Gemini AI
const genAI = process.env.GEMINI_API_KEY ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY) : null;

interface BriefData {
    title: string;
    facts: string;
    issue: string;
    rule: string;
    analysis: string;
    conclusion: string;
    tags: string[];
}

/**
 * Sanitize and validate the response from Gemini
 */
function sanitizeResponse(data: any): BriefData {
    return {
        title: sanitizeString(data.title || '', 200),
        facts: sanitizeString(data.facts || '', 8000),
        issue: sanitizeString(data.issue || '', 4000),
        rule: sanitizeString(data.rule || '', 5000),
        analysis: sanitizeString(data.analysis || '', 8000),
        conclusion: sanitizeString(data.conclusion || '', 4000),
        tags: Array.isArray(data.tags) 
            ? data.tags.slice(0, 8).map((t: any) => sanitizeString(String(t), 30)).filter(Boolean)
            : []
    };
}

/**
 * Sanitize string input by removing null bytes and limiting length
 */
function sanitizeString(input: string, maxLength: number): string {
    return input
        .replace(/\0/g, '') // Remove null bytes
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '') // Remove control characters
        .slice(0, maxLength)
        .trim();
}

/**
 * Multer middleware for PDF uploads
 */
export const uploadPdf = upload.single('pdf');

/**
 * Handler for PDF summarization
 */
export const summarizeBriefHandler = async (req: Request, res: Response): Promise<void> => {
    let tempFilePath: string | null = null;

    try {
        // Check if Gemini API key is configured
        if (!process.env.GEMINI_API_KEY || !genAI) {
            return res.status(500).json({ error: 'AI service not configured' });
        }

        // Authenticate the user
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        let userId: string;
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

        let briefData: any;
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

    } catch (error: any) {
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
}; 