from Crypto.Hash import MD5
from Crypto.Cipher import AES
import sys
import os

def decrypt(key, data):
    key = key.encode('utf-8')
    hexkey = MD5.new(key).hexdigest()[:16]
    decrypter = AES.new(hexkey)
    return decrypter.decrypt(data)

if len(sys.argv) != 2:
    print ("Usage: %s list-file pack-file" % sys.argv[0])
    print(MD5.new('pack'.encode('utf-8')).hexdigest()[:16])
    print(MD5.new('battlecats'.encode('utf-8')).hexdigest()[:16])
else:
    list_file = sys.argv[1]+".list"
    pack_file = sys.argv[1]+".pack"
    try:
        os.mkdir('./'+sys.argv[1])
    except:
        pass

    list_file_data = decrypt("pack", open(list_file, "rb").read())
    pack_file_data = open(pack_file, "rb").read()
    list_file_data = list_file_data.decode('utf-8')

    open('decode_'+sys.argv[1]+'_list.txt', "w+").write(list_file_data)
    file_list = list_file_data.split("\n")
    num_files = int(file_list[0])
    file_list = file_list[1:]

    for i in range(0, num_files):
        file_info = file_list[i].split(",")
        file_name = file_info[0]
        file_offset = int(file_info[1])
        file_size = int(file_info[2])
        print ("Writing %s...Progressing %.2f" % (file_name,i/num_files*100),end='\r')
        try:
            file_data = decrypt("battlecats", pack_file_data[file_offset:file_offset+file_size])
        except:
            print('exception')
            file_data = pack_file_data[file_offset:file_offset+file_size]

        open('./'+sys.argv[1]+'/'+file_name, "wb+").write(file_data)
