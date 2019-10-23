import { Component, OnInit } from '@angular/core';
import { UploadFileService } from 'src/app/services/upload-file.service'
import {NgForm} from '@angular/forms';

@Component({
  selector: 'app-upload-file',
  templateUrl: './upload-file.component.html',
  styleUrls: ['./upload-file.component.css']
})

export class UploadFileComponent implements OnInit {

  message_to_front: string[] = [];
  message_recived_from_back: any;
  selectedFile: File = null;

  
  ngOnInit() {}

	constructor(private uploadFileService: UploadFileService) {}
  //-------------------------------------------------------------------------------------------------
  // Funcion que recoge el valor del fichero del front
	onFileChanged = (event) => {
		this.selectedFile = event.target.files[0];
    }

  //-------------------------------------------------------------------------------------------------
  // Funcion que empieza a enviar el fichero y llama a la funcion que gestiona todo
  onUploadFile() {
    console.log("FRONT: Upload File...")
    this.F_SendFile(this.selectedFile)
  }

  //-------------------------------------------------------------------------------------------------
  // Funcion que gestiona el envio de fichero por eventos
  F_SendFile(file: File){
    // ---- Inicializo variables ----
    var chunkSize  = 1024 //Chunk de 1 Mb = 1024*1024 | 1024 bytes = 1 Kb
    var offset = 0
    var endIndex = 0
    var action = 'prepare'
    var endIndex = Math.min(file.size, (offset + chunkSize) )
    // ---- Empiezo a enviar datos de inicio hacia el back para empezar el proceso ----
    console.log("FRONT: Send start info data...")
    this.F_sendInfoFile(action, chunkSize, offset, file)
    // ---- Como el back envia datos, espero a recibirlos en este evento y empiezo a gestionar ----
    this.uploadFileService.onMessageReceived((evnt) => {
      this.message_recived_from_back = evnt
        // ---- Actualizo las variables con el resultado del back ----
        offset = JSON.parse(this.message_recived_from_back.data)["offset_from_back"]
        endIndex = Math.min(file.size, (offset + chunkSize) )
      if ( (JSON.parse(this.message_recived_from_back.data)["message_from_back"]=="receiving") && (file.size>offset) ){
        this.F_sendChunkFile(offset ,endIndex, file)
        console.log("FRONT: Sending chunks...")
        offset = JSON.parse(this.message_recived_from_back.data)["offset_from_back"]
        endIndex =  Math.min(file.size, (offset + chunkSize) )
      }

      else if ( (JSON.parse(this.message_recived_from_back.data)["message_from_back"]=="receiving") && (file.size<=offset) ){
        action = "complete"
        console.log("FRONT: Fichero completado...")
        this.F_sendInfoFile(action, chunkSize, offset, file)
      }

      else if ( (JSON.parse(this.message_recived_from_back.data)["message_from_back"]=="exist") ){
        action = "complete"
        console.log("FRONT: Fichero existente...")
        this.F_sendInfoFile(action, chunkSize, offset, file)
      }

    });    

  }
  
  //-------------------------------------------------------------------------------------------------
  // Funcion que gestiona el envio de chunks del fichero en bytes
  arrayBuffer:any = null;
  array: any = null;
  F_sendChunkFile(_offset, _endIndex, _file) {
    console.log("FRONT: Starting chunks...")
    var reader = new FileReader();   
    var blob = _file.slice(_offset, _endIndex);
    reader.readAsArrayBuffer(blob); 
    reader.onload = (evento) => { 
      this.arrayBuffer = reader.result; 
      this.array = new Uint8Array(this.arrayBuffer),
      this.uploadFileService.F_SendChunkFile_From_Front(this.array)
        }
    }

  //-------------------------------------------------------------------------------------------------
  // Funcion que gestiona el envio de datos del fichero en string
  F_sendInfoFile = function (action, chunkSize, offset, file: File) {
    var data = {
      action_from_front : action,
      file_size_from_front : file.size,
      file_size_chunk_from_front: chunkSize,
      offset_from_front: offset,
      file_name_from_front : file.name,
      file_name_sin_extension_from_front: file.name.substring(0, file.name.lastIndexOf('.')),
      file_type_from_front: file.name.split('.').pop(),
      }
    this.uploadFileService.F_SendInfoFile_From_Front(JSON.stringify(data));  
    console.log("FRONT: Enviando file info: " + JSON.stringify(data) )
  }
  //-------------------------------------------------------------------------------------------------

}








