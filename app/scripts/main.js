var stats = {};
var entries = [];


function makeApiCall() {
  queryCoreReportingApi('68993365');
}

function queryCoreReportingApi(profileId) {
  console.log('Querying Core Reporting API.');

  // Use the Analytics Service Object to query the Core Reporting API
  gapi.client.analytics.data.ga.get({
    'ids': 'ga:' + profileId,
    'start-date': '2015-02-01',
    'end-date': '2015-03-01',
    'dimensions': 'ga:pagePath',
    'metrics': 'ga:pageviews',
    'filters': 'ga:pagePath=@posts;ga:timeOnPage>0',
    'max-results': '10000'
  }).execute(handleCoreReportingResults);
}

function handleCoreReportingResults(results) {
  if (results.error) {
    console.log('There was an error querying core reporting API: ' + results.message);
  } else {
    printResults(results);
  }
}

function getQueryParameters(str) {
	  var stepone = str.replace(/^.*(\?)/,'').split("&")
	  var params = {} 
	  stepone.forEach(function(part) {
	  	part = part.split("=")
	  	var key = part[0]
	  	var value = part[1]
        
        if (_.has(params, key)) {
        	params[key].push(value)
        } else {
        	params[key] = []
        	params[key].push(value)
        }
	  })
	  return params
} 

function printResults(results) {
  if (results.rows && results.rows.length) {

  	entries = [];
  	results.rows.forEach(function(en) {
  		entry = {};
  		entry.Page = en[0];
  		entry.pageviews = en[1];
  		entry.params = getQueryParameters(en[0])
  		if(entry.params.start && entry.params.end) {
  			entry.params.timespan = moment(entry.params.end[0]).diff( moment(entry.params.start[0]),'days');
  		} else {
  			entry.params.timespan = 0
  		}

  		if(entry.params.sources) {
  			entry.source_count = entry.params.sources.length
  		} else {
  			entry.source_count = 0
  		}

  		if(entry.params.kind_name) {
  			entry.kind_count = entry.params.kind_name.length
  		} else {
  			entry.kind_count = 0
  		}

  		entries.push(entry);
  	})



  	stats.total_pageviews = sum(_.pluck(entries, 'pageviews'))
  	processNetworks()
  	processKinds()
  	processPosters() 
  	processTimespans()
  	console.log(stats)

  	

    $.get('templates/main.mustache', function(template) {
		var rendered = Mustache.render(template, entries);
	    $('#table').html(rendered);
	    $('#the-table').DataTable({
	    	paging: false
	    });
	});
	$.get('templates/stats.mustache', function(template) {
		var rendered = Mustache.render(template, stats);
	    $('#stats').html(rendered);
	    
	});
   
  } else {
    console.log('No results found');
  }
}

function processNetworks() {
	var network = _.filter(entries, function(entry) {
  		return entry.source_count > 0
  	})
  	stats.network_pageviews = sum(_.pluck(network, 'pageviews'))
  	
}

function processKinds() {
	var kinds = _.filter(entries, function(entry) {
  		return entry.kind_count > 0
  	})
  	stats.kind_pageviews = sum(_.pluck(kinds, 'pageviews'))
  	
}

function processPosters() {
	var rows = _.filter(entries, function(entry) {
  		return _.has(entry.params, 'poster_id')
  	})
  	stats.poster_pageviews = sum(_.pluck(rows, 'pageviews'))
  	
}

function processTimespans() {
	var week = _.filter(entries, function(entry) {
		return (entry.params.timespan == 7)
	})
	stats.week_pageviews = sum(_.pluck(week, 'pageviews'))
	var day = _.filter(entries, function(entry) {
		return (entry.params.timespan == 1)
	})
	stats.day_pageviews = sum(_.pluck(day, 'pageviews'))
	var month = _.filter(entries, function(entry) {
		return (entry.params.timespan == 31)
	})
	stats.month_pageviews = sum(_.pluck(month, 'pageviews'))
}

function sum(numbers) {
	return _.reduce(numbers, function(memo, num){ return parseInt(memo) + parseInt(num); }, 0);
} 
