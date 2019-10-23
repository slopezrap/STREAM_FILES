import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { WebSocketService } from './web-socket.service';




const UPLOAD_FILE_URL = 'ws://' + '127.0.0.1:8000' + '/file/upload' + '/'

@Injectable({
  providedIn: 'root'
})
export class UploadFileService {
	private SubjectSend_from_Front: Subject<any>;

	constructor(private wsService: WebSocketService) {
		//Hago la conexion en el constructor para que solo exista un socket
		this.SubjectSend_from_Front = <Subject<any>>this.wsService.connect(UPLOAD_FILE_URL)
	} 

    // ------------------------------------------------------------------------------------------------
  	F_SendInfoFile_From_Front(data: string){
		this.SubjectSend_from_Front.next(data);
	  }
	// ------------------------------------------------------------------------------------------------  
	F_SendChunkFile_From_Front(data: any){
		this.SubjectSend_from_Front.next(data);
	  } 
    // ------------------------------------------------------------------------------------------------

	// ------------------------------------------------------------------------------------------------
	onMessageReceived(callback: (value: string) => void){
		this.SubjectSend_from_Front.subscribe(callback);
	  }
	  
}