function makeApiCall() {
  queryCoreReportingApi('68993365');
}

function queryCoreReportingApi(profileId) {
  console.log('Querying Core Reporting API.');
  var startDate =  document.getElementById('startdate').value;
  var endDate =  document.getElementById('enddate').value;

  // Use the Analytics Service Object to query the Core Reporting API
  gapi.client.analytics.data.ga.get({
    'ids': 'ga:' + profileId,
    'start-date': startDate,
    'end-date': endDate,
    'dimensions': 'ga:pagePath',
    'metrics': 'ga:pageviews',
    'filters': 'ga:pagePath=@posts;ga:timeOnPage>0'
  }).execute(handleCoreReportingResults);
}

function handleCoreReportingResults(results) {
  if (results.error) {
    console.log('There was an error querying core reporting API: ' + results.message);
  } else {
    printResults(results);
  }
}


function printResults(results) {
  if (results.rows && results.rows.length) {
    console.log('View (Profile) Name: ', results.profileInfo.profileName);
    results.rows.forEach(function(row) {
    	 console.log('Total Sessions: ',row[1]);
    }) 
   
  } else {
    console.log('No results found');
  }
}