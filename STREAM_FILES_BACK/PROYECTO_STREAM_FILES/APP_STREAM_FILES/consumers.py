
from channels.generic.websocket import AsyncWebsocketConsumer
import json
import random
from django.core.files import File
from .models import Documento
from django.conf import settings
import os

class FileConsumer(AsyncWebsocketConsumer):
    #1 - El front envia peticion y se conecta
    async def connect(self):
        self.room_group_name = 'FileUpload' + str(random.randint(0, 10000))
        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()
        print("BACK: Conexion aceptada | Room Group Name %s | Channel Name: %s " % (self.room_group_name, self.channel_name))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    #2 - Recibimos los mensajes del front, dependiendo de si es text_data o bytes_data
    async def receive(self, text_data=None, bytes_data=None):
        #Recibo el text_data y lo trato para enviarlo a los grupos
        if (text_data):
            print("BACK: Recibiendo text_data ...")
            #Paso de string a JSON
            text_data_json = json.loads(text_data)
            data_from_front = {
                'type': 'handler_data', #Con esto llamo a la clase async def handler_data(self, event)
                'action': text_data_json['action_from_front'],
                'file_size': text_data_json['file_size_from_front'],
                'file_size_chunk': text_data_json['file_size_chunk_from_front'],
                'file_offset': text_data_json['offset_from_front'],
                'file_name': text_data_json['file_name_from_front'],
                'file_name_sin_extension': text_data_json['file_name_sin_extension_from_front'],
                'file_type': text_data_json['file_type_from_front']
            }
            #Guardo los valores en una variable global
            global data_from_front_global
            data_from_front_global = data_from_front
            await self.channel_layer.group_send(self.room_group_name, data_from_front)

        #Recibo el byte_data y lo trato para enviarlo a los grupos
        elif (bytes_data):
            print("BACK: Recibiendo bytes_data ...")
            bytes_from_front = {
                    'type': 'handler_bytes', #Con esto llamo a la clase async def handler_bytes(self, event)
                    'bytes': bytes_data
                }
            await self.channel_layer.group_send(self.room_group_name, bytes_from_front)

    #3 - Dependiendo del 'type': viene a un metodo u otro - EN ESTE CASO ES EL TYPE DE text_data
    async def handler_data(self, event):
        #Si la accion que viene del front es prepare compruebo si tengo un fichero (completo o incompleto) o no
        if (event['action'] == "prepare"):
            print("BACK: Procesando datos")
            path_file_temp_save = settings.PATH_TEMP_FILES_ROOT + '/' + data_from_front_global['file_name']
            #Si tengo el fichero pero esta incompleto, le digo al front por donde debe empezar a enviarme los datos para que se complete
            if(os.path.exists(path_file_temp_save) and (os.path.getsize(path_file_temp_save) < data_from_front_global['file_size']) ):
                print("BACK: Existe fichero sin terminar")
                data_from_back = {
                    'offset_from_back': os.path.getsize(path_file_temp_save),
                    'message_from_back': "receiving",
                }
            #Si tengo el fichero ya completo le digo que existe
            elif( (os.path.exists(path_file_temp_save)) and (os.path.getsize(path_file_temp_save)== data_from_front_global['file_size']) ):
                print("BACK: Existe fichero terminado")
                data_from_back = {
                    'offset_from_back': os.path.getsize(path_file_temp_save),
                    'message_from_back': "exist",
                }
            #Si no tengo el fichero le digo que lo envie desde el principio.
            else:
                print("BACK: No existe fichero")
                data_from_back = {
                    'offset_from_back': 0,
                    'message_from_back': "receiving",
                }

        elif (event['action'] == "complete"):
            print("BACK: Envio completo")
            path_file_temp_save = settings.PATH_TEMP_FILES_ROOT + '/' + data_from_front_global['file_name']
            temp_file = open(path_file_temp_save, "rb")
            file_to_save_in_database = File(temp_file)
            modelDocumento = Documento()
            #Fichero lo guardamos en la base de datos y esta en media
            modelDocumento.fichero.save(data_from_front_global['file_name'], file_to_save_in_database, save=True)
            temp_file.close()
            #falta meterlo en la carpeta para asignarlo a un model y luego borrar el auxiliar
            data_from_back = {
                'offset_from_back': os.path.getsize(path_file_temp_save),
                'message_from_back': "stop",
            }
            os.remove(path_file_temp_save)
            print("BACK: Fichero guardado en BBDD")

        await self.send(text_data=json.dumps(
            data_from_back
        ))

    # 3 - Dependiendo del 'type': viene a un metodo u otro - EN ESTE CASO ES EL TYPE DE bytes_data
    async def handler_bytes(self, event):
        print("BACK: Procesando bytes")
        #Lo que hago es guardar en una ruta temporal el fichero para luego, una vez que este terminado el fichero
        #pueda guardarlo en la base de datos
        path_file_temp_save = settings.PATH_TEMP_FILES_ROOT+'/'+data_from_front_global['file_name']
        file_append = open(path_file_temp_save,"ab") #ab significa append y guardo bytes
        file_append.write(event['bytes'])
        file_append.close()
        data_from_back = {
            'offset_from_back': os.path.getsize(path_file_temp_save),
            'message_from_back': "receiving",
        }
        await self.send(text_data=json.dumps(
            data_from_back
        ))
