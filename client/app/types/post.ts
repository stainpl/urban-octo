export interface Post {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  tags: string[];
  authorName?: string;
  createdAt: string;
  updatedAt: string;
}
