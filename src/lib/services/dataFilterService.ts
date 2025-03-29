import { CaseBrief } from '../models/caseBrief';

// Define types for different levels of case brief access
export interface PublicBriefPreview {
  id: string;
  title: string;
  court?: string;
  date?: string;
  factsPreview?: string;
  issuePreview?: string;
  viewCount?: number;
  createdAt: number;
}

export interface BasicBriefPreview extends PublicBriefPreview {
  citation?: string;
  issuePreview?: string;
  holdingPreview?: string;
}

export type PartialCaseBrief = Partial<CaseBrief>;

export class DataFilterService {
  /**
   * Filter a case brief based on user access level
   * @param brief The full case brief
   * @param accessLevel The user's access level
   * @returns Filtered case brief data appropriate for the access level
   */
  filterBriefByAccessLevel(
    brief: CaseBrief, 
    accessLevel: 'public' | 'authenticated' | 'premium' | 'admin'
  ): PublicBriefPreview | BasicBriefPreview | CaseBrief {
    // No filtering for premium users and admins
    if (accessLevel === 'premium' || accessLevel === 'admin') {
      return brief;
    }

    // Basic info for authenticated users
    if (accessLevel === 'authenticated') {
      return this.getBasicPreview(brief);
    }

    // Very limited info for public (unauthenticated) users
    return this.getPublicPreview(brief);
  }

  /**
   * Get a public preview of a case brief (for unauthenticated users)
   */
  getPublicPreview(brief: CaseBrief): PublicBriefPreview {
    return {
      id: brief.id || '',
      title: brief.title,
      court: brief.court,
      date: brief.date,
      factsPreview: brief.facts ? this.truncateText(brief.facts, 100) : undefined,
      viewCount: brief.viewCount,
      createdAt: brief.createdAt
    };
  }

  /**
   * Get a basic preview of a case brief (for authenticated but non-premium users)
   */
  getBasicPreview(brief: CaseBrief): BasicBriefPreview {
    return {
      id: brief.id || '',
      title: brief.title,
      court: brief.court,
      date: brief.date,
      citation: brief.citation,
      factsPreview: brief.facts ? this.truncateText(brief.facts, 150) : undefined,
      issuePreview: brief.issue ? this.truncateText(brief.issue, 150) : undefined,
      holdingPreview: brief.holding ? this.truncateText(brief.holding, 150) : undefined,
      viewCount: brief.viewCount,
      createdAt: brief.createdAt
    };
  }

  /**
   * Filter an array of case briefs based on user access level
   */
  filterBriefsByAccessLevel(
    briefs: CaseBrief[], 
    accessLevel: 'public' | 'authenticated' | 'premium' | 'admin'
  ): (PublicBriefPreview | BasicBriefPreview | CaseBrief)[] {
    return briefs.map(brief => this.filterBriefByAccessLevel(brief, accessLevel));
  }

  /**
   * Truncate text to a specified length and add ellipsis
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }
}

// Export a singleton instance
export const dataFilterService = new DataFilterService(); 