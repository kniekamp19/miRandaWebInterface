#!/usr/bin/python3

"""
@author: Kristen Niekamp
This is the CGI file to communicate with the HTML template for loading
query results to a webpage.
"""
import cgi, json
import os
import subprocess

def run_miranda(options):
#run the miRanda algorithm on the input query/subject sequences
    args_list = []
    #this holds the command with options for miRanda
    #query/reference files were written during file/format validation
    if (options['loose'] == 'True'):
        args_list = ['./miranda','query.txt','subject.txt','-sc',options['score'], \
        '-en',options['energy'],'-scale',options['scale'],'-loose','-go', \
        options['gapOpen'],'-ge',options['gapExtend']]
    else:
        args_list = ['./miranda','query.txt','subject.txt','-sc',options['score'],\
        '-en',options['energy'],'-scale',options['scale'],'-go',options['gapOpen'], \
        '-ge',options['gapExtend']]

    #run miRanda on user input query/reference files and with user-defined options
    results = subprocess.run(args_list,stdout=subprocess.PIPE,stderr=subprocess.STDOUT,text=True,universal_newlines=True)  
    format_results(results,args_list)
    
#read and format results into list of dicts to convert to JSON and send to JS
def format_results(results,options):
    #split results into individual lines separated by '\n'
    lines = results.stdout.splitlines()
    entries = [] #this will be the list of dicts
    entry = {} #this will hold details of individual query-reference pairs
    #parse through each line and store relevant information for each
    #query-reference sequence scan (stored on lines that start with '>>')
    for l in lines:
        if (l[0:2] == '>>'):
            cols = l.split()
            entry['query'] = cols[0][2:] #query header
            entry['reference'] = cols[1] #reference header
            entry['tot_score'] = cols[2]
            entry['tot_energy'] = cols[3]
            entry['max_score'] = cols[4]
            entry['max_energy'] = cols[5]
            entry['strand'] = cols[6]
            entry['query_len'] = cols[7] #query length
            entry['ref_len'] = cols[8] #reference length
            #positions on reference where alignment occurred
            entry['positions'] = ','.join(cols[9:])
            entry['options'] = ' '.join(options[3:])
            entries.append(entry.copy()) #add entry to list of entries

    #send results and result count to JS as JSON
    query_results = { 'num_results' : len(results), 'results' : results }
    print(json.dumps(query_results))


def main():
    print("Content-Type: text/json\n\n")
    form = cgi.FieldStorage()
    #retrieve user-input options from JS storage
    options_json = form.getfirst('options')
    options = json.loads(options_json)
    
    run_miranda(options)

 

if __name__ == '__main__':
    main()        
