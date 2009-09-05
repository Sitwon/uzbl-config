// Copyright (C) 2009 Aldrik Dunbar
(function() {
	var class_name = "opened_in_editor";
	var run = Uzbl.run;
	var String_methods = {
		replace: String.prototype.replace,
		match: String.prototype.match
	};

	var is_insert_mode = function() {
		return run("print @insert_mode") === "1";
	};

	var edit = function(content, filetype) {
		var env = run("print @(env)@");
		var match = String_methods.match.call(env, /[\n^]EDITOR=([^\n]+)/);
		var editor = match ? match[1] : "vim";
		var term = (match = String_methods.match.call(env, /[\n^]XTERM=([^\n]+)/)) ? match[1] : "xterm";
		var socket = run("print @{socket_dir}/uzbl_socket_@{NAME}@");
		var file = run("print /tmp/uzbl_editor_@{NAME}@");
		var eof_marker = "UZBL_EDITOR_EOF";
		var vim_cmd = " --cmd \"au BufRead " + file + " setl ft=" + filetype + "\"";
		var post_edit_cmd = "&& uzblctrl -s " + socket + " -c \"js " +
			"(function() {" +
				"var run = Uzbl.run;" +
				"delete Uzbl;" +
				"var element = document.querySelector(\\'." + class_name + "\\');" +
				"if (element) {" +
					"element.value = run(\\'print @(cat " + file + ")@\\');" +
					"element.className = e.className.slice(0, -(\\' " + class_name + "\\'.length));" +
				"}" +
			"})();\" " +
			"&& rm " + file;
		while (String_methods.match.call(content, eof_marker)) {
			eof_marker += "_";
		}
		if (term === "urxvtc") {
			term = "urxvt";
		}
		if (editor === "vi" || editor === "nano") {
			editor = term + " -e " + editor;
		}
		else if (editor === "vim") {
			editor = term + " -e " + editor + vim_cmd;
		}
		else if (editor === "gvim") {
			editor += vim_cmd;
		}
		content = String_methods.replace.call(String_methods.replace.call(content, /\\/g, "\\\\\\\\"), /'/g, "\\'");
		run("sh 'cat <<" + eof_marker + " > " + file + "\n" + content + "\n" + eof_marker + "'");
		run("sh '" + editor + " " + file + " " + post_edit_cmd + "'");
	};

	var open_in_editor = function(event) {
		if (event.keyCode === 105 && event.ctrlKey && !event.shiftKey && !event.altKey && is_insert_mode()) {
			var element = event.target;
			if (element.type === "textarea" || element.type === "text") {
				element.className += " " + class_name;
				var filetype = "";
				if (location.host.match(/\.wikipedia.org$/)) {
					filetype = "Wikipedia";
				}
				else if(location.host.match(/^wiki\./) || location.href.match(/\/wiki\//)) {
					filetype = "flexwiki";
				}
				else if (location.host.match(/^bbs\./) || location.href.match(/\/forum\//)) {
					filetype = "bbcode";
				}
				edit(element.value, filetype);
				event.stopPropagation();
				event.preventDefault();
			}
		}
	};

	window.addEventListener("keypress", open_in_editor, true);
})();

// vim: set noet ff=unix