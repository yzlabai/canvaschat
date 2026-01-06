export interface Credit {
  trans_no: string;
  created_at: string;
  user_uuid: string;
  trans_type: string;
  credits: number;
  memo?: string;
  expired_at?: string;
}
