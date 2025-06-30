import { UploadedFile } from "./uploaded-file.model";

export interface UploadedFolder {
  id?: string;
  name: string;
  size: number;            
  createdAt: string;  
  shared? : boolean;     
  files?: UploadedFile[];  
}