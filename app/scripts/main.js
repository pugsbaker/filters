var stats = {};
var entries = [];


function makeApiCall() {
  queryCoreReportingApi('68993365');
}

function queryCoreReportingApi(profileId) {
  console.log('Querying Core Reporting API.');
  var startDate =  document.getElementById('startdate').value;
  var endDate =  document.getElementById('enddate').value;
  var isPosts = document.getElementById('posts').checked;
  var filter = 'ga:pagePath=@/?,ga:pagePath==/;ga:timeOnPage>0';
  if(isPosts) {
    filter = 'ga:pagePath=@posts;ga:pagePath!@poster_id;ga:timeOnPage>0';
  }
  

  // Use the Analytics Service Object to query the Core Reporting API
  gapi.client.analytics.data.ga.get({
    'ids': 'ga:' + profileId,
    'start-date': startDate,
    'end-date': endDate,
    'dimensions': 'ga:pagePath',
    'metrics': 'ga:pageviews',
    'filters': filter,
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

  		if(entry.params.place_id) {
  			entry.places_count = entry.params.place_id.length
  		} else {
  			entry.places_count = 0
  		}
  		entries.push(entry);
  	})



  	stats.total_pageviews = sum(_.pluck(entries, 'pageviews'))
  	processPlaces()
  	processNetworks()
  	processKinds()
  	processPosters() 
  	processTimespans()
  	console.log(stats)
    initTimeChart();
    initChart();

  	

 //    $.get('templates/main.mustache', function(template) {
	// 	var rendered = Mustache.render(template, entries);
	//     $('#table').html(rendered);
	//     $('#the-table').DataTable({
	//     	paging: false
	//     });
	// });
	$.get('templates/stats.mustache', function(template) {
		var rendered = Mustache.render(template, stats);
	    $('#stats').html(rendered);
	    initTimeChart();
	});
   
  } else {
    console.log('No results found');
  }
}

function initTimeChart() {
  var data = {
  // A labels array that can contain any sort of values
  //labels: ['Day', 'Week', 'Month', 'Year', 'Custom'],
  // Our series array that contains series objects or in this case series data arrays
  series: [stats.day_pageviews, stats.week_pageviews, stats.month_pageviews, stats.year_pageviews, stats.custom_time_pageviews]
  
  };
  var options = {
    labelDirection: 'explode'
    ,labelOffset: 100
    ,chartPadding: 60  
    ,labelInterpolationFnc: function(value) {
      return Math.round(value / stats.time_pageviews * 100) + '%';
    }
  }

  new Chartist.Pie('.ct-chart-time', data, options);

}
function initChart() {
  var data = {
    // A labels array that can contain any sort of values
    labels: ['Total', 'Time', 'Location', 'Multi Location', 'Kind', 'Network'],
    // Our series array that contains series objects or in this case series data arrays
    series: [
      [stats.total_pageviews, stats.time_pageviews, stats.places_pageviews, stats.places_multi_pageviews, stats.kind_pageviews, stats.network_pageviews]
    ]
  };

  new Chartist.Bar('.ct-chart-filters', data).on('draw', function(data) {
    if(data.type === 'bar') {
      data.element.attr({
        style: 'stroke-width: 60px'
      });
    }
  });

}

function processPlaces() {
	var rows = _.filter(entries, function(entry) {
  		return entry.places_count > 0
  	})
  	stats.places_pageviews = sum(_.pluck(rows, 'pageviews'))
    stats.places_percent = getPercent(stats.places_pageviews);
    rows = _.filter(entries, function(entry) {
      return entry.places_count > 1
    })
  	stats.places_multi_pageviews = sum(_.pluck(rows, 'pageviews'))
    stats.places_multi_percent = getPercent(stats.places_multi_pageviews);
}

function processNetworks() {
	var network = _.filter(entries, function(entry) {
  		return entry.source_count > 0
  	})
  	stats.network_pageviews = sum(_.pluck(network, 'pageviews'))
  	stats.network_percent = getPercent(stats.network_pageviews);
}

function processKinds() {
	var kinds = _.filter(entries, function(entry) {
  		return entry.kind_count > 0
  	})
  	stats.kind_pageviews = sum(_.pluck(kinds, 'pageviews'))
  	stats.kind_percent = getPercent(stats.kind_pageviews);
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
		return (entry.params.timespan == 31 || entry.params.timespan == 28 || entry.params.timespan == 30)
	})
	stats.month_pageviews = sum(_.pluck(month, 'pageviews'))
  var year = _.filter(entries, function(entry) {
    return (entry.params.timespan > 350)
  })
  stats.year_pageviews = sum(_.pluck(year, 'pageviews'))
  var total = _.filter(entries, function(entry) {
    return (entry.params.timespan > 0)
  })
  stats.time_pageviews =  sum(_.pluck(total, 'pageviews'))
  var set_time = stats.week_pageviews + stats.day_pageviews + stats.month_pageviews + stats.year_pageviews;
  stats.custom_time_pageviews =  stats.time_pageviews - set_time 
  stats.no_time_pageviews = stats.total_pageviews - stats.time_pageviews

  stats.time_percent = getPercent(stats.time_pageviews);


}
function getPercent(value) {
  var val = value/stats.total_pageviews * 100
  return Math.round(val * 100) / 100
}

function sum(numbers) {
	return _.reduce(numbers, function(memo, num){ return parseInt(memo) + parseInt(num); }, 0);
} 






