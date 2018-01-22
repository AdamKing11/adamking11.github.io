// set up variables.....
var initial_reg = '^cheese|^wine$'
var brushed_color = "red";
var mouseon_color = "blue";
var future_color = "green";
var past_color = "orange";

// some "helper functions" first....
// from our large data file, only select the subset that matches the regex filter
function regex_lexfilter(re) {
	// data_full is the name of the full dataset
	var data = [];
	for (var i = 0; i < data_full.length; i++) {
		if (re.exec(data_full[i].word)) {
			data.push(data_full[i])
		}
	}
	return data;
}

function join_list(l, c) {
	s = l[0];
	for (var i = 1; i < l.length; i++) {
		s += c + l[i];
	}
	return s;
}

var selected_word = '';
var brushed_words = [];

// get list of words in our current data
function calc_lex() {
	lexicon = [];
	for (var i = 0; i < data.length; i++) {
		lexicon.push(data[i].word);
	}
	lexicon.sort()
	
	d3.select("#ul-lexicon")
		.selectAll("li")
		.remove();

	d3.select("#ul-lexicon")		
		.selectAll("li")
		.data(lexicon)
		.enter()
		.append("li")
		.text(function(w) { return w; })
		.on('mouseover click', function(w) {
			selected_word = w;
			
			c_svg.selectAll('.word-group')
				.selectAll('circle')
				.filter(function(d) { return d.word === selected_word; })
				.attr("class", 'point-mouseon')
				.attr('r', function(d) { selected_word = d.word; return wordsize_scale(d.word.length) + 2});

			d3.select("#ul-lexicon")
				.selectAll("li")
				.filter(function(v) { return v === selected_word; })
				.attr("style", "color: " + mouseon_color + " ; font-weight: bold");
		})
		.on('mouseout', function(d) { 
			c_svg.selectAll('.word-group')
				.selectAll('circle')
				.filter(function(e) { return e.word === selected_word; })
				.attr('r', function(e) { selected_word = e.word; return wordsize_scale(e.word.length)})
				.attr('class', 'point-mouseoff');

			if (brushed_words.length > 0) {
				d3.select("#ul-lexicon")
					.selectAll("li")
					.filter(function(w) { return brushed_words.indexOf(w) < 0;} )
					.attr("style", "color: black; font-weight: normal");
				
				d3.select("#ul-lexicon")
					.selectAll("li")
					.filter(function(w) { return brushed_words.indexOf(w) >= 0;} )
					.attr("style", "color: " + brushed_color + "; font-weight: bold");
			} else {
				d3.select("#ul-lexicon")
					.selectAll("li")
					.attr("style", "color: black; font-weight: normal");				
			}
			selected_word = '';
			
		})		
}

function mod_year(y, m) { return (parseInt(y) + m).toString();	}

// because of the way I set up the data, need this function to go into the data structure
// to find the max value for stuff
function find_max_of_data(d, t) {
	var l = [];
	var dec_keys = Object.keys(d.decs)
	for (var i = 0; i < dec_keys.length; i++) {
		l.push(d.decs[dec_keys[i]][t][scale_type]);
	}
	return Math.max(...l);	
}

// for our brush, given an x and y, is that within the confines of the passed brush?
function point_in_brush(px, py, b_c) {
	if (b_c === null) { return false; }
	var x_lower = b_c[0][0], x_upper = b_c[1][0];
	var y_lower = b_c[0][1], y_upper = b_c[1][1];
	return ((px >= x_lower && px <= x_upper) &&
			(py >= y_lower && py <= y_upper));
}

document.getElementById("data-regex").value = initial_reg;
var lexicon = [];
var data = regex_lexfilter(new RegExp(document.getElementById("data-regex").value));
calc_lex();

var cur_year = '1950';
var scale_type = 'info';
var min_year = 1800;
var max_year = 2000;

var width = 800;
var height = 700;

var tl_height = 100;
var words_stats_w = 100;

var x_offset = 100;
var y_offset = 100;

var tl_brush_ext = [cur_year, parseInt(cur_year) + 10];

// start building the skeletons for the graphs
var c = d3.select("#c");
var tl = d3.select("#tl");

var c_svg = c.append('svg')
    .attr("width", width)
    .attr("height", height);

var tl_svg = tl.append('svg')
	.attr("width", width)
	.attr("height", tl_height);

var x_scale = d3.scaleLinear()
	.range([x_offset, width - x_offset ])
	.domain([d3.max(data_full, function(d) { return find_max_of_data(d, 't') }),0]);

var y_scale = d3.scaleLinear()
	.range([height - y_offset, y_offset])
	.domain([d3.max(data_full, function(d) { return find_max_of_data(d, 'u') }),0]);

var tl_scale = d3.scaleLinear()
	.domain([min_year, max_year])
	.range([x_offset * .5, width - (.5 * x_offset)]);

var wordsize_scale = d3.scaleSqrt()
	.domain([1, d3.max(data, function(d) { return d.word.length })])
	.range([3,7]);

// set up the axes
// x axis
var px_axis = c_svg.append("g");
px_axis.call(d3.axisBottom(x_scale))
	.attr("transform", "translate(0," + (height - y_offset) + ")")
	.attr("class", "x-axis");
// x label
c_svg.append("g")
	.append("text")
	.attr('text-anchor', 'middle')
	.attr("transform", "translate(" + (width * .5) + "," + (height - (.25 * y_offset)) + ")")
	.text("-log Contextual Probability")
	.attr("class", "x-label");
// y axis
var py_axis = c_svg.append("g");
py_axis.call(d3.axisLeft(y_scale))
	.attr("transform", "translate(" + x_offset + ",0)")
	.attr("class", "y-axis");
// y label
c_svg.append("g")
	.append("text")
	.attr('transform', 'rotate(-90)')
	.attr('x', -(height) * .65)
	.attr('y', x_offset * .35)
	.text("-log Unigram Probability")
	.attr("class", "y-label");

// set up the title
c_svg.append("g")
	.append("text")
	.attr('text-anchor', 'middle')
	.attr("transform", "translate(" + (width * .5) + "," + (.5 * y_offset) + ")")
	.attr("font-size", 22)
	.attr("class", "chart-title")
	.text("-log Probability");

// helper arrows
// these little graphics let the viewer keep grounded and remember what a big value
// for either factor means...
var top_helper = c_svg.append("g");
top_helper.append("text")
	.attr('text-anchor', 'middle')
	.attr("transform", "translate(" + (width * .75) + "," + (.75 * y_offset) + ")")
	.attr("font-size", 12)
	.text("More Contextually Probable");	

top_helper.append("path")
	.attr("stroke", "black")
	.attr("d", "M" + (width * .6) + " " + (.85 * y_offset) + " L" + (width * .85) + " " + (.85 * y_offset) +
		"L" + (width * .825) + " " + (.8 * y_offset) + " L" + (width * .825) + " " + (.9 * y_offset) +	
		" L" + (width * .85) + " " + (.85 * y_offset));

var side_helper = c_svg.append("g");
side_helper.append("text")
	.attr('text-anchor', 'middle')
	.attr("font-size", 12)
	.attr('transform', 'rotate(-90)')
	.attr('x', -height * .35)
	.attr('y', width * .95)
	.text("More Frequent");
	
side_helper.append("path")
	.attr("stroke", "black")
	.attr("d", "M" + (width * .925) + " " + (.5 * height) + " L" + (width * .925) + " " + (.2 * height) +
		"L" + (width * .9175) + " " + (.225 * height) + " L" + (width * .9325) + " " + (.225 * height) +
		" L" + (width * .925) + " " + (.2 * height));


// set up the timeline
tl_svg.append("g")
	.call(d3.axisBottom(tl_scale))
	.attr("transform", "translate(0," + (tl_height/2) + ")");

var brush_corners;

var point_brush = d3.brush()
	.on('start', function(d) { 
		// when we click to start the brush, reset everything
		c_svg.selectAll('.word-group')
			.filter(function(e) {
				return brushed_words.indexOf(e.word) < 0;
			})
			.attr('fill', 'black')
			.attr('stroke', 'black')
			.attr('fill-opacity', 1)
			.attr('stroke-opacity', 1);

		d3.select("#ul-lexicon")
			.selectAll("li")
			.attr("style", "color: black; font-weight: normal");
	})
	.on('brush end', function(d) {
		// once we're dragging the brush, highlight the words within
		// gives back the top left corner and bottom right
		brush_corners = d3.event.selection;
		
		brushed_words = [];
		// select the right word-group objects
		c_svg.selectAll('.word-group')
			.filter(function(e) { 
				var x_rank = x_scale(e.decs[cur_year]['t'][scale_type]), y_rank = y_scale(e.decs[cur_year]['u'][scale_type]);
				var should_highlight = point_in_brush(x_rank, y_rank, brush_corners);
				if (should_highlight) { brushed_words.push(e.word); } 
				return should_highlight;
			})
			// highlight the circles
			.attr("fill", brushed_color)
			.attr("stroke", brushed_color)
			.attr('fill-opacity', 1)
			.attr('stroke-opacity', 1);
		

		// make non-brushed points grayed out
		if (brushed_words.length > 0) {
			c_svg.selectAll('.word-group')
				.filter(function(e) {
					return brushed_words.indexOf(e.word) < 0;
				})
				.attr('fill', 'black')
				.attr('stroke', 'black')
				.attr('stroke-opacity', .3)
				.attr('fill-opacity', .3);
		}
		brushed_words.sort();

		// highlight the selected words
		d3.select("#ul-lexicon")
			.selectAll("li")
			.filter(function(w) { return brushed_words.indexOf(w) >= 0; })
			.attr("style", "color: " + brushed_color + "; font-weight: bold")
		})

// add the brush
c_svg.append('g')
	.attr('class', 'brush')
	.call(point_brush);

// build a path for the future or past of a data point
function historic_path(d, min_step, max_step) {
	var x_hist_scale = x_scale;
	var y_hist_scale = y_scale;
	var p = '';
	for (var i = min_step; i <= max_step; i ++) {
		var new_hist_year = mod_year(cur_year, -10 * i)
		if (new_hist_year >= min_year && new_hist_year <= max_year) {
			if (p.length === 0) {
				p += 'M';
			} else {
				p += ' L';
			}
		p += x_hist_scale(d.decs[new_hist_year]['t'][scale_type]) + ' ' + y_hist_scale(d.decs[new_hist_year]['u'][scale_type]);
		}
	}
	return p;
}

function move_tl_brush(d, new_year) {

	if (new_year === undefined) {
		var tb_loc = d3.event.selection;
		tl_brush_ext = tb_loc.map(tl_scale.invert);
		new_year = (tl_brush_ext[0] + tl_brush_ext[1])/2;
		new_year = Math.round(new_year/10) * 10;
	}

	if (new_year >= min_year & new_year <= max_year) {
		var time_passed = cur_year - new_year;
		cur_year = new_year.toString();

		// animation for moving the circle to the new point
		c_svg.selectAll("circle")
			.transition()
			.duration(100)
			.attr('cx', function(d) { return x_scale(d.decs[cur_year]['t'][scale_type]) })
			.attr('cy', function(d) { return y_scale(d.decs[cur_year]['u'][scale_type]) });

		////////////////////////////////////////
		c_svg.selectAll(".word-group")
			.selectAll("path")
			.remove();
		
		// historic path
		c_svg.selectAll(".word-group")
			.append("path")
			.attr("fill", "none")
			.attr("stroke", past_color)
			.attr("stroke-opacity", 0)
			.attr("stroke-dasharray", "10, 5")
			.attr("d", function(d) {
				return historic_path(d, 0, 7);
			})
		// use this animation to keep the path invisible until a little while AFTER the movement
		// this keeps the graphs from getting crazy during long, quick movements on the timeline
			.transition()
			.delay(500)
			.duration(500)
			.attr("stroke-opacity", .4);

		// future path
		c_svg.selectAll(".word-group")
			.append("path")
			.attr("fill", "none")
			.attr("stroke", future_color)
			.attr("stroke-opacity", 0)
			.attr("stroke-dasharray", "5, 10")
			.attr("d", function(d) {
				return historic_path(d, -7, 0);
			})
			.transition()
			.delay(500)
			.duration(500)
			.attr("stroke-opacity", .4);
		////////////////////////////////////////
	}
}

var tl_brush = d3.brushX()
	.filter(function () {return d3.mouse(this)[0] > tl_scale(tl_brush_ext[0]) && d3.mouse(this)[0] < tl_scale(tl_brush_ext[1])})
	.on('brush', function(d) { move_tl_brush(d) } );

var tl_bg = tl_svg.append('g')
	.call(tl_brush)
	.attr('class', 'tl-brush')
	.call(tl_brush.move, [cur_year-5, parseInt(cur_year) + 5].map(tl_scale));

// hack: this keeps the timeline brush from being re-sized
tl_svg.selectAll('.tl-brush>.handle').remove();


function move_tl_slider(new_year, dur) {
	if (dur === undefined) {
		dur = 100 * Math.abs(cur_year - new_year);
	}
	tl_bg.transition()
		.duration(dur)
		.call(tl_brush.move, [new_year-5, new_year+5].map(tl_scale));
}

// this functon draws out the points for all words we're currently interested in
function draw_points() {
	///////////////////////////////////////////////////////////////
	c_svg.selectAll('.word-group')
		.remove();

	c_svg.selectAll("circle")
		.data(data)
		.enter()
		.append("g")
		.attr('class', 'word-group')
		.attr('fill', 'black')
		.attr('stroke', 'black')
		.attr('fill-opacity', 1)
		.append("circle")
		.attr('class', 'point-mouseoff')
		.attr('r', function(d) { return wordsize_scale(d.word.length) })
		.attr('cx', function(d) { return x_scale(d.decs[cur_year]['t'][scale_type]) })
		.attr('cy', function(d) { return y_scale(d.decs[cur_year]['u'][scale_type]) })
		.on('mouseover click', function(d) {
			d3.select(this)
				.attr("class", 'point-mouseon')
				.attr('r', function(d) { selected_word = d.word; return wordsize_scale(d.word.length) + 2});
			
			d3.select("#ul-lexicon")
				.selectAll("li")
				.filter(function(w) { return w === selected_word; })
				.attr("style", "color: " + mouseon_color + "; font-weight: bold");

			d3.select("#ul-brushed")
				.selectAll("li")
				.filter(function(w) { return w === selected_word; })
				.attr("style", "color: " + mouseon_color + "; font-weight: bold");
		})
		.on('mouseout', function(d) { 
			d3.select(this)
				.attr('r', function(d) { selected_word = d.word; return wordsize_scale(d.word.length)})
				.attr('class', 'point-mouseoff');

			if (brushed_words.length > 0) {
				d3.select("#ul-lexicon")
					.selectAll("li")
					.filter(function(w) { return brushed_words.indexOf(w) < 0;} )
					.attr("style", "color: black; font-weight: normal");
				
				d3.select("#ul-lexicon")
					.selectAll("li")
					.filter(function(w) { return brushed_words.indexOf(w) >= 0;} )
					.attr("style", "color: " + brushed_color + "; font-weight: bold");
			} else {
				d3.select("#ul-lexicon")
					.selectAll("li")
					.attr("style", "color: black; font-weight: normal");				
			}
		})
		.append("svg:title")
		.text(function(d) { return d.word; });
		
	c_svg.selectAll(".word-group")
		.append("path")
		.attr("fill", "none")
		.attr("stroke-dasharray", "5,5");
	///////////////////////////////////////////////////////////////
}
draw_points()
// for changing from raw -log probability to ranks and vice versa
function scale_by(s_type) {
	scale_type = s_type;
	var start = 0;
	if (s_type === 'rank') { start = 1; }
	x_scale.domain([d3.max(data_full, function(d) { return find_max_of_data(d, 't') }), start]);
	y_scale.domain([d3.max(data_full, function(d) { return find_max_of_data(d, 'u') }), start]);

	c_svg.selectAll(".x-axis")
		.transition()
		.duration(500)
		.call(d3.axisBottom(x_scale))
		.attr("transform", "translate(0," + (height - y_offset) + ")");
		
	c_svg.selectAll(".y-axis")
		.transition()
		.duration(500)
		.call(d3.axisLeft(y_scale))
		.attr("transform", "translate(" + x_offset + ",0)")

	c_svg.selectAll("circle")
		.transition()
		.duration(500)
		.attr('cx', function(d) { return x_scale(d.decs[cur_year]['t'][scale_type]) })
		.attr('cy', function(d) { return y_scale(d.decs[cur_year]['u'][scale_type]) });

	if (s_type === 'rank') {
		c_svg.selectAll('.chart-title')
			.transition()
			.duration(500)
			.text('-log Probability Rank');

		c_svg.selectAll('.x-label')
			.transition()
			.duration(500)
			.text('Contextual Probability Rank');

		c_svg.selectAll('.y-label')
			.transition()
			.duration(500)
			.text('Unigram Rank');
	} else {
		c_svg.selectAll('.chart-title')
			.transition()
			.duration(500)
			.text('-log Probability');

		c_svg.selectAll('.x-label')
			.transition()
			.duration(500)
			.text('-log Contextual Probability');
		c_svg.selectAll('.y-label')
			.transition()
			.duration(500)
			.text('-log Unigram Probability');
	}
}

// for filtering the total data by the regular expression
function change_lex() {
	var r = new RegExp(document.getElementById("data-regex").value)
	data = regex_lexfilter(r);
	calc_lex();
	draw_points();
}

