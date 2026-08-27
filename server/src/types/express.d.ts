export {};

declare global {
  namespace Express {
    interface Request {
      lang: string;
      user?: {
        id: number;
        username: string;
        role: string;
        employeeId?: number | null;
        permissions?: string[];
      };
    }
  }
}