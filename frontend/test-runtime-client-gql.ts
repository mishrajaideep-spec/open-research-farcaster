export class TextMessage {
  content: string;
  role: string;
  constructor({ content, role }: { content: string; role: string }) {
    this.content = content;
    this.role = role;
  }
}
export const Role = { User: 'user' };
