#!/usr/local/bin/python3

'''
Kristen Niekamp

This script sends the input files to be validated for FASTA format
using subprocess and validate_fasta.py (from Biocode). 
It also checks that the files are not empty.
'''

import cgi
import cgitb
import subprocess
cgitb.enable()

def main():
    print("Content-Type: text/plain\n\n")
    form = cgi.FieldStorage() #retrieve file contents
    query = form.getfirst('query')
    subject = form.getfirst('subject')
    
    #check if either file is empty 
    if (query is None or subject is None):
        print('One or both file(s) is empty.')
        return
    #rewrite file contents into text file
    #command line program only accepts files for input
    queryFile = open('query.txt','w')
    query = query.replace('\r','') #remove DOS metacharacters
    queryFile.write(query)
    queryFile.close()
    
    subjectFile = open('subject.txt','w')
    subject = subject.replace('\r','')
    subjectFile.write(subject)
    subjectFile.close()
    
    #run files through FASTA validation for basic formatting check
    try: 
        valid = subprocess.run(['./validate_fasta.py','query.txt','subject.txt'], \
                                stdout=subprocess.PIPE,stderr=subprocess.PIPE, \
                                universal_newlines=True)  
    except Exception as e:
        print('File format(s) are not valid.')
    #replace validate_fasta output newlines with HTML breaks for formatting
    else:
        lines = valid.stdout.replace('\n','<br>')
        if 'ERROR' in lines:
            print(lines)
        else:
            print('Files are valid.')

if __name__ == '__main__':
    main()
