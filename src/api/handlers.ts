import { Request, Response } from 'express';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { CaseBrief } from '../lib/models/caseBrief';

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