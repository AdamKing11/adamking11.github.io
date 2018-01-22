function shuffle(l) {
	return l.sort(function(a, b) {return 0.5 - Math.random()});
};

function range(n) {
	return Array.apply(null, Array(n)).map(function (_, i) {return i;});
};

function normal_rand(m, sd) {
	if (m === undefined) { m = 0; }
	if (sd === undefined) { sd = 0; }
	// using Box-Muller transformation, gives a normal distribution with mean = 0, sd = 1
	var r = Math.sqrt(-2.0 * Math.log(Math.random())) * Math.cos(2.0 * Math.PI * Math.random());
	return m + (r * sd);
}

function new_random_lex(lex_size, word_len_mean, nb_symbols) {
	lex = [];
	// just making this up
	var word_len_sd = Math.max(1,Math.round(word_len_mean/3));
	for (var i = 0; i < lex_size; i++) {
		new_word_len = Math.round(normal_rand(word_len_mean, word_len_sd))
		new_word = [];
		for (var j = 0; j < new_word_len; j++) {
			new_word.push(Math.floor(Math.random() * nb_symbols));
		}
		lex.push(new_word);
	};
	return lex;
};

function new_uniform_lex(lex_size, word_len) {
	lex = [];
	for (var i = 0; i < lex_size; i++) {
		new_word = range(word_len);
		lex.push(new_word);
	};
	return lex;
};

function longest_word(lex) {
	var longest_len = 0;
	for (var i = 0; i < lex.length; i++) {
		if (lex[i].length > longest_len) { longest_len = lex[i].length; }
	};
	return longest_len;
}

function count(l) {
	var counter = {};
	for (var i = 0; i < l.length; i++) {
		if (counter[l[i]] === undefined) {counter[l[i]] = 0; };
		counter[l[i]]++;	
	};
	return counter;
};

function sum(l) {
	return l.reduce(function(a,b) { return a+b; } );
};

function random_word(lex) {
	var index = Math.floor(lex.length * Math.random());
    return index;
};

function summary_stats(d_dict) {
	var longest = 0;
	// lexical info
	var s = [];
	// positional info
	var r = [];
	var s_stats = [];
	// loop through the lexical info words b/c positional has the weird -99
	for (var i in d_dict['lex']) {
		cur_word = d_dict['lex'][i];
		cur_word_pos = d_dict['pos'][i];
		// get longest word in the lex
		// should be same for positional and lexical
		if (cur_word.length > longest) { longest = cur_word.length};

		// 
		for (var j = 0; j < cur_word.length; j++) {
			if (s[j] === undefined) {s[j] = []; };
			s[j].push(cur_word[j]);
		};
		for (var j = 0; j < cur_word_pos.length; j++) {
			if (r[j] === undefined) {r[j] = []; };
			r[j].push(cur_word_pos[j]);
		};

	};
	
	for (var i = 0; i < longest; i++) {
		var m = sum(s[i]) / s[i].length;
		var n = sum(r[i]) / r[i].length;
		
		// 0 for lexical
		// 1 for positional
		s_stats.push({position : i+1, mean : n, type : 'Positional'});
		s_stats.push({position : i+1, mean : m, type : 'Lexical'});
		
	}
	return s_stats;
};

function segmental_information(lex) {
	var prefix_counts = {};
	var char_at_position = {};

	// count the "prefixes"
	for (var i = 0; i < lex.length; i++) {
		var cur_word = lex[i];
		for (var j = 0; j < cur_word.length; j++) {
			var prefix = cur_word.slice(0, j+1)
			if (prefix_counts[prefix] === undefined) {prefix_counts[prefix] = 0; };
			if (char_at_position[j] === undefined) {
				char_at_position[j] = {}; 
				char_at_position[j][-99] = 0;
			};
			if (char_at_position[j][cur_word[j]] === undefined) { char_at_position[j][cur_word[j]] = 0;	};
			prefix_counts[prefix]++;
			char_at_position[j][cur_word[j]]++;
			// -99 as placeholder for ALL charaters at position p
			char_at_position[j][-99]++;
		};
	};

	var lexical_info = {};
	var positional_info = {};
	//calc the segmental info based on prefix count vs prefix[:-1] count
	for (var i = 0; i < lex.length; i++) {
		var cur_word = lex[i];
		var word_segment_info = [];
		var word_position_info = [];
		for (var j = 0; j < cur_word.length; j++) {
			var sequence_c = prefix_counts[cur_word.slice(0,j+1)];
			if (j == 0) {
				var context_c = lex.length;
			} else {
				var context_c = prefix_counts[cur_word.slice(0,j)];
			};
					
			
			var seg_info = -Math.log(sequence_c/context_c) / Math.log(2);
			var pos_info = -Math.log(char_at_position[j][cur_word[j]]/char_at_position[j][-99])/ Math.log(2);
			word_segment_info.push(seg_info);
			word_position_info.push(pos_info);

		};
		lexical_info[i] = word_segment_info;
		positional_info[i] = word_position_info;
	};	
	return {lex : lexical_info, pos : positional_info};
};

function horizontal_shuffle(lex) {
	var word_to_shuffle = random_word(lex);
	var shuffled_word = shuffle(lex[word_to_shuffle]);
	lex[word_to_shuffle] = shuffled_word;
	return lex;
}

function vertical_shuffle(lex) {
	var word1 = random_word(lex);
	var word2 = word1;
	while (word2 == word1) {
		word2 = random_word(lex);
	}
	var max_char = Math.min([word1.length, word2.length])
	var char_to_swap = Math.floor(Math.random() * max_char);

	var char1 = word1[char_to_swap];
	var char2 = word2[char_to_swap];

	lex[word1][char_to_swap] = char2;
	lex[word2][char_to_swap] = char1;
	return lex;
}
