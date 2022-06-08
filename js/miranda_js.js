function readFiles() {
//this function reads in files contents as a string for further use
    var qReader = new FileReader();
    var rReader = new FileReader();
    var queryFile = $( '#queryFile' )[0].files[0]; 
    var refFile = $( '#subjectFile' )[0].files[0];
    //Reader object reads in text from files
    qReader.readAsText(queryFile);
    rReader.readAsText(refFile);
    //waits for files to load and reads them as text
    qReader.onload = function() {
        rReader.onload = function() {
        var qtext = qReader.result;
        var rtext = rReader.result;
        if (!checkIfFasta(qtext,rtext)) {
            return;
        }
        };
    };
}

//check that files were uploaded and are not > 100MB
function validateFiles() {
    //get query and reference file metadata
    var queryFile = $( '#queryFile' )[0];
    var refFile = $( '#subjectFile' )[0];
    var queryFileSize = queryFile.size / 1024 / 1024;
    var refFileSize = refFile.size / 1024 / 1024;
    //keep file size under 100MB
    if ( queryFileSize > 100 || refFileSize > 100 ) {
        $( '#feedback' ).html('File size limit is 100 MB. Please ensure files are proper size.');
        return false;
    }
    //check if files were uploaded
    else if ( queryFile.value == '' || refFile.value == '' ) {
        $( '#feedback' ).html('One or both input files is missing.');
        return false;
    }
    //no issues
    return true;
}

//this function makes an AJAX call to validate_files.py, which sends
//the query and ref sequences through validate_fasta.py to check FASTA format
function checkIfFasta(query, ref) {
    //send file contents to be checked for FASTA format
    $.ajax({
        url:'./validate_files.cgi',
        dataType: 'text',
        data: { query: query, subject: ref },
        success: function(data,textStatus,jqXHR) {
            $( '#feedback' ).html(data);
            runQuery(query,ref);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            alert('Failed to validate files. textStatus: (' + 
            textStatus + ') and errorThrown: (' + errorThrown + ')');
            return;
        }
    });
} 


//reset results section and conduct query
function runQuery(query,ref) {
    //hide and clear results section
    $('#results').hide();
    $('tbody').empty();
    
    //retrieve files
    var removeStrict; //check if user wants to remove strict duplex heuristics
    if(document.getElementById('looseyes').checked) {
        removeStrict = 'True';
    }
    else {
        removeStrict = 'False';
    }
    //put options in JSON object
    var options_json = {
        score: $( '#score' ).val(),
        energy : $( '#energy' ).val(),
        scale : $( '#scale' ).val(),
        loose : removeStrict,
        gapOpen : $( '#gapopen' ).val(),
        gapExtend : $( '#gapextend' ).val()
    };
    options = JSON.stringify(options_json);
    //send data to CGI file for server-side analysis
    $.ajax({
        url:'./run_miranda.cgi',
        dataType: 'json',
        data: { options: options },
        success: function(data, textStatus, jqXHR) {
            processJSON(data);
        },
        error: function(jqXHR, textStatus, errorThrown) {
            console.log('Failed to run miRanda miRNA target prediction. textStatus: (' +
            textStatus + ') and errorThrown: (' + errorThrown + ')');
        }
    });
}


//processes the passed JSON object from Python  to generate the result table
function processJSON(data) {
    //output count of results
    $('#num_results').text(data.num_results);
   
    //increment row IDs
    var next_row_num = 1;
     
    //iterate over each result and add a row
    $.each(data.results, function(i,item) {
        //use to generate and keep track of row IDs
        var this_row_id = 'result_row_' + next_row_num++;
        //create row and append to table
        $('<tr/>', {'id' : this_row_id}).appendTo('tbody');
        
        //add columns
        $('<td/>', { 'text' : item.result_id }).appendTo('#' + this_row_id);
        $('<td/>', { 'text' : item.query }).appendTo('#' + this_row_id);
        $('<td/>', { 'text' : item.reference }).appendTo('#' + this_row_id);
        $('<td/>', { 'text' : item.tot_score }).appendTo('#' + this_row_id);
        $('<td/>', { 'text' : item.tot_energy }).appendTo('#' + this_row_id);
        $('<td/>', { 'text' : item.max_score }).appendTo('#' + this_row_id);
        $('<td/>', { 'text' : item.max_energy }).appendTo('#' + this_row_id);
        $('<td/>', { 'text' : item.ref_len }).appendTo('#' + this_row_id);
        $('<td/>', { 'text' : item.positions }).appendTo('#' + this_row_id);
	$('<td/>', { 'text' : item.options })appendTo('#' + this_row_id);
    });
    //show results section (previously hidden)
    $('#results').show();
}

//run javascript when the page is ready
$(document).ready( function() {
    $( '#submit' ).on('click', function() {
        if (validateFiles()) {
            readFiles();            
        }
        return false; //prevent normal form submission
    });
})
