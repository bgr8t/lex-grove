import { FirestoreService } from '../firestore';
import { CaseBrief } from '../models/caseBrief';
import { query, collection, where, or, and, orderBy, limit, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { pineconeService } from './pineconeService';

// Create CaseBrief service that extends FirestoreService
class CaseBriefService extends FirestoreService<CaseBrief> {
  constructor() {
    super('caseBriefs');
  }

  // Get all case briefs for a user
  async getCaseBriefsByUser(userId: string): Promise<CaseBrief[]> {
    return this.query([{ field: 'userId', operator: '==', value: userId }], {
      field: 'createdAt',
      direction: 'desc'
    });
  }

  // Get all community briefs
  async getAllCommunityBriefs(limit = 20): Promise<CaseBrief[]> {
    return this.query([], {
      field: 'createdAt',
      direction: 'desc'
    }, limit);
  }

  // Helper method to convert document data to a CaseBrief object
  private docToCaseBrief(id: string, data: any): CaseBrief {
    // Explicitly define all the fields we need without using spread
    return {
      id,
      title: data.title || '',
      citation: data.citation || '',
      court: data.court || '',
      date: data.date || '',
      facts: data.facts || '',
      issue: data.issue || '',
      holding: data.holding || '',
      reasoning: data.reasoning || '',
      userId: data.userId || '',
      upvotes: data.upvotes || 0,
      viewCount: data.viewCount || 0,
      createdAt: data.createdAt || 0,
      updatedAt: data.updatedAt || 0
    };
  }

  // Search case briefs with support for different filters
  async searchCaseBriefs(
    searchQuery: string, 
    filter: 'all' | 'title' | 'content' | 'course' = 'all',
    sortOption: 'recent' | 'relevant' | 'popular' = 'relevant',
    limitCount = 20
  ): Promise<CaseBrief[]> {
    const collectionRef = collection(db, 'caseBriefs');
    const searchLower = searchQuery.toLowerCase().trim();
    
    // If empty query, return all briefs
    if (!searchLower) {
      return this.getAllCommunityBriefs(limitCount);
    }
    
    try {
      // If sortOption is 'relevant', try semantic search with Pinecone first
      if (sortOption === 'relevant') {
        try {
          console.log('Attempting semantic search with Pinecone');
          // Get similar brief matches from Pinecone
          const semanticResults = await pineconeService.searchSimilarBriefs(searchQuery, limitCount);
          
          if (semanticResults.length > 0) {
            console.log(`Found ${semanticResults.length} semantic results`);
            // Get the IDs from the results
            const briefIds = semanticResults.map(result => result.id);
            
            if (briefIds.length > 0) {
              console.log('Fetching full brief data from Firestore');
              // Manually fetch briefs from Firestore
              const briefs: CaseBrief[] = [];
              
              for (const id of briefIds) {
                try {
                  const docRef = doc(db, 'caseBriefs', id);
                  const docSnap = await getDoc(docRef);
                  
                  if (docSnap.exists()) {
                    const brief = this.docToCaseBrief(docSnap.id, docSnap.data());
                    
                    // Apply filter if needed
                    if (this.applyTextFilter(brief, searchLower, filter)) {
                      briefs.push(brief);
                    }
                  }
                } catch (err) {
                  console.error(`Error fetching brief ${id}:`, err);
                }
              }
              
              if (briefs.length > 0) {
                console.log(`Returning ${briefs.length} semantic search results`);
                return briefs;
              }
            }
          }
        } catch (error) {
          console.error('Error performing semantic search:', error);
          // Continue with regular search if semantic search fails
        }
      }
      
      let q;
      
      // Build query based on filter type
      if (filter === 'title') {
        // Search only in titles - we'll filter client-side since Firebase doesn't support contains
        q = query(collectionRef, orderBy('title'));
      } else if (filter === 'content') {
        // For content search, we need to query all briefs and filter client-side
        q = query(collectionRef);
      } else if (filter === 'course') {
        // For course search, we need to query all briefs and filter by court field
        q = query(collectionRef, orderBy('court'));
      } else {
        // For 'all' filter, we just query all briefs
        q = query(collectionRef);
      }
      
      // Add sorting
      if (sortOption === 'recent') {
        q = query(q, orderBy('createdAt', 'desc'));
      } else if (sortOption === 'popular') {
        // Sort by viewCount if available, otherwise by createdAt
        q = query(q, orderBy('viewCount', 'desc'), orderBy('createdAt', 'desc'));
      }
      
      // Execute the query
      const snapshot = await getDocs(q);
      
      // Filter results client-side based on search criteria
      const results = snapshot.docs
        .map(doc => this.docToCaseBrief(doc.id, doc.data()))
        .filter(brief => this.applyTextFilter(brief, searchLower, filter))
        .slice(0, limitCount);
      
      return results;
    } catch (error) {
      console.error("Error searching case briefs:", error);
      return [];
    }
  }
  
  // Helper method to apply text filtering
  private applyTextFilter(brief: CaseBrief, searchLower: string, filter: 'all' | 'title' | 'content' | 'course'): boolean {
    const title = brief.title.toLowerCase();
    const court = brief.court?.toLowerCase() || '';
    const facts = brief.facts?.toLowerCase() || '';
    const issue = brief.issue?.toLowerCase() || '';
    const holding = brief.holding?.toLowerCase() || '';
    const reasoning = brief.reasoning?.toLowerCase() || '';
    
    switch (filter) {
      case 'title':
        return title.includes(searchLower);
      
      case 'content':
        return (
          facts.includes(searchLower) || 
          issue.includes(searchLower) || 
          holding.includes(searchLower) || 
          reasoning.includes(searchLower)
        );
        
      case 'course':
        return court.includes(searchLower);
        
      case 'all':
      default:
        return (
          title.includes(searchLower) || 
          court.includes(searchLower) || 
          facts.includes(searchLower) || 
          issue.includes(searchLower) || 
          holding.includes(searchLower) || 
          reasoning.includes(searchLower)
        );
    }
  }

  // Get a single case brief by ID with access control
  async getCaseBriefById(id: string, userId?: string | null, membershipStatus?: string | null): Promise<CaseBrief | null> {
    try {
      const brief = await this.getById(id);
      
      if (!brief) {
        console.warn(`Case brief with ID ${id} not found`);
        return null;
      }
      
      // Only increment view count if user is authenticated
      if (userId) {
        // Increment view count asynchronously (don't wait for it)
        this.incrementViewCount(id).catch(err => {
          //console.error(`Failed to increment view count for brief ${id}:`, err);
        });
      }
      
      // Return the full brief for all users without content truncation
      return brief;
    } catch (error) {
      //console.error(`Error fetching case brief with ID ${id}:`, error);
      return null;
    }
  }

  // Create a new case brief
  async createCaseBrief(caseBrief: Omit<CaseBrief, 'id' | 'createdAt' | 'updatedAt'>): Promise<CaseBrief> {
    try {
      const now = Date.now();
      
      // Add timestamp fields
      const briefWithTimestamps = {
        ...caseBrief,
        createdAt: now,
        updatedAt: now
      };
      
      // Save to Firebase
      const savedBrief = await this.create(briefWithTimestamps);
      
      // After successfully saving to Firebase, save to Pinecone as well
      try {
        console.log('Attempting to save to Pinecone:', savedBrief.id);
        await pineconeService.saveCaseBrief(savedBrief);
        console.log('Successfully saved to Pinecone');
      } catch (pineconeError) {
        // Log error but don't fail the entire operation if Pinecone save fails
        console.error('Error saving to Pinecone:', pineconeError);
        // Could add retry logic or async job queue here
      }
      
      return savedBrief;
    } catch (error) {
      console.error('Error creating case brief:', error);
      throw error;
    }
  }

  // Update a case brief
  async updateCaseBrief(id: string, data: Partial<Omit<CaseBrief, 'id' | 'createdAt' | 'userId'>>): Promise<void> {
    return this.update(id, {
      ...data,
      updatedAt: Date.now()
    });
  }

  // Increment view count for a brief
  async incrementViewCount(id: string): Promise<void> {
    try {
      const brief = await this.getById(id);
      if (brief) {
        const currentViews = brief.viewCount || 0;
        await this.update(id, { 
          viewCount: currentViews + 1 
        });
      }
    } catch (error) {
      console.error(`Error incrementing view count for brief ${id}:`, error);
    }
  }

  // Update upvotes for a brief
  async updateUpvotes(id: string, increment: number): Promise<void> {
    try {
      const brief = await this.getById(id);
      if (brief) {
        const currentUpvotes = brief.upvotes || 0;
        await this.update(id, { 
          upvotes: currentUpvotes + increment 
        });
      }
    } catch (error) {
      console.error(`Error updating upvotes for brief ${id}:`, error);
    }
  }

  // Get top viewed briefs
  async getTopViewedBriefs(limitCount = 5): Promise<CaseBrief[]> {
    try {
      const collectionRef = collection(db, 'caseBriefs');
      // Query with sorting by viewCount in descending order
      const q = query(
        collectionRef,
        orderBy('viewCount', 'desc'),
        limit(limitCount)
      );
      
      const snapshot = await getDocs(q);
      
      // Convert documents to CaseBrief objects
      const briefs = snapshot.docs.map(doc => this.docToCaseBrief(doc.id, doc.data()));
      
      return briefs;
    } catch (error) {
      console.error("Error fetching top viewed briefs:", error);
      return [];
    }
  }
}

// Export a singleton instance
export const caseBriefService = new CaseBriefService(); 