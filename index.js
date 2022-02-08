var fs = require("fs");
var path = require('path');
var Handlebars = require("handlebars");
var utils = require('handlebars-utils');
var marked = require('marked').marked;
var luxon = require('luxon');


Handlebars.registerHelper('is', function(value, test, options) {
    return (value && value === test) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('isnt', function(value, test, options) {
    return (!value || value !== test) ? options.fn(this) : options.inverse(this);
});

Handlebars.registerHelper('markdown', function(str, locals, options) {
	if (typeof str !== 'string') {
		options = locals;
		locals = str;
		str = true;
	}

	if (utils.isOptions(locals)) {
		options = locals;
		locals = {};
	}

	var ctx = utils.context(this, locals, options);
	var val = utils.value(str, ctx, options);

	var markup = marked(val);

	// If we end up with a string wrapped in one <p> block, remove it so we don't create a new text block
	var startEndMatch = markup.match(/^<p>(.*)<\/p>\n$/);
	return startEndMatch && startEndMatch[1].indexOf("<p>") === -1 ?
		startEndMatch[1] :
		markup;
});

Handlebars.registerHelper('displayUrl', function(str) {
	return str.replace(/https?:\/\/(www\.)?/, "");
});

Handlebars.registerHelper('toLowerCase', function(str) {
	return str.toLowerCase();
});

Handlebars.registerHelper('formatDate', function(str) {
	if (str) {
		return luxon.DateTime.fromISO(str).toFormat('M/y');
	} else {
		return "Present"
	}
});

Handlebars.registerHelper('award', function(str) {
	switch (str.toLowerCase()) {
		case "bachelor":
		case "master":
			return str + "s";
		default:
			return str;
	}
});

Handlebars.registerHelper('skillLevel', function(str) {
	switch (str.toLowerCase()) {
		case "beginner":
			return "25%";
		case "intermediate":
			return "50%";
		case "advanced":
			return "75%";
		case "master":
			return "100%";
		default:
			return parseInt(str) + "%"
	}
});

function render(resume) {
	var css = fs.readFileSync(__dirname + "/assets/css/styles.css", "utf-8");
	var js = fs.readFileSync(__dirname + "/assets/js/main.js", "utf-8");
	var tpl = fs.readFileSync(__dirname + "/resume.hbs", "utf-8");

	var partialsDir = path.join(__dirname, 'partials');
	var filenames = fs.readdirSync(partialsDir);

	filenames.forEach(function (filename) {
	  var matches = /^([^.]+).hbs$/.exec(filename);
	  if (!matches) {
	    return;
	  }
	  var name = matches[1];
	  var filepath = path.join(partialsDir, filename);
	  var template = fs.readFileSync(filepath, 'utf8');

	  Handlebars.registerPartial(name, template);
	});

	const packageJSON = require("./package");
	return Handlebars.compile(tpl)({
		css: css,
		js: js,
		resume: resume,
		meta: {
			packageName: packageJSON.name,
			version:  packageJSON.version
		}
	});
}

module.exports = {
	render: render,
	pdfRenderOptions: {
		format: 'letter',
		mediaType: 'print',
		pdfViewport: { width: 960, height: 1260 },
		scale: 0.8,
		margin: {
			top: '0.25in',
			bottom: '0.25in',
			left: '0.25in',
			right: '0.25in',
		},
	},
};
