var noAnimTimeout,
	fancyBoxMargin,
	win = $(window),
	doc = $(document),
	wrap = $('#wrap'),
	body = $('body'),
	popstateRequired = false;

// initialise the scripts when the page is ready
doc.ready(function(){
	closeNotification();
	dialogs();

	win.trigger('resize');
});

// fire scripts on window resize
win.resize(function(){
	resizeNoAnim();
});

win.on('scroll', function(){

});


function newDialog(options, afterDialogueDisplay) {
	var modalBody = '';

	// Build the buttons markup for the dialog
	if(options.buttons){
		modalBody += '<div class="ui-buttons">';
		for(var button in options.buttons){
			var thisButton = options.buttons[button];
			modalBody += '<a class="text-button" data-action="'+thisButton.action+'">'+thisButton.text+'</a>';
		}
		modalBody += '</div>';
	}

	// If options include video, build the iframe markup. 
	if (options.pollData) {
		modalBody += options.pollData;
	}

	// Loop through data attributes which will be applied to the dialog container.
	var dataAttributes = '';
	if(options.data){
		for(var data in options.data){
			var thisData = options.data[data];
			dataAttributes += ' data-'+thisData.label+'="'+thisData.value+'"';
		}
	}

	// If heading is defined, build the markup.
	var dialogheading = options.heading ? '<h3>' + options.heading + '</h3>' : '';

	// if text is defined, build the markup.
	var dialogText = options.text ? '<h3>' + options.text + '</h3>' : '';

	var dialog = 
	'<div class="ui-overlay"'+ dataAttributes +'>' + 
		'<div class="ui-dialog">' + 
			dialogheading +
			dialogText + 
			modalBody +
	'</div></div>';

	body.append(dialog);

	// Animate in the dialogue
	setTimeout(function(){ $('.ui-overlay').addClass('anim-in'); },20);
	setTimeout(function(){ $('.ui-dialog').addClass('anim-in'); },200);
	stopScrolling();

	// Run anything set in the callback function after dialog has displayed. 
	setTimeout(function() {
		if (afterDialogueDisplay) {
			afterDialogueDisplay();
		}
	}, 400);
};

function closeDialog() {
	$('.ui-overlay').removeClass('anim-in').addClass('anim-out');
	$('.ui-dialog').addClass('anim-out').removeClass('anim-in');

	setTimeout(function(){ 
		$('.ui-dialog, .ui-overlay').remove(); 

		if (body.hasClass('events-attendee-detail')) {
			// Reset attendee filter on close of dislog
			siasAttendees.resetAttendeeDialog();
		}
	},200);

	if (body.hasClass('stop-scrolling')) {
		resumeScrolling();
	};
};

var loader = $('.loader');
function toggleLoader() {
	if (loader.hasClass('hide-loader')) {
		loader.removeClass('hide-loader lower-loader');
	} else {
		loader.addClass('hide-loader');
		setTimeout(function() {
	  		loader.addClass('lower-loader');
		}, 500);
	}
};

function dialogs() {
    body.on('click', '[data-action="close-dialog"], .ui-overlay',function(){
    	closeDialog();
    });

    // Close Dialog on esc key press
    $(document).keyup(function(e) { 
        if (e.keyCode == 27) { 
        	closeDialog();
        } 
    });

    body.on('click', '.ui-dialog',function(e){
        e.stopPropagation();
    });
};

function resizeNoAnim(){
	body.addClass('no-anim');
	clearTimeout(noAnimTimeout);
	noAnimTimeout = setTimeout(function(){
		body.removeClass('no-anim');
	},150);
};

function stopScrolling(){
    curScrollPos = win.scrollTop();
	wrap.addClass('no-anim-single');
    wrap.attr('style','width:'+win.width()+'px; margin-top:-'+curScrollPos+'px;min-height:'+win.height()+'px; position:fixed;');
    oldScrollPos = curScrollPos;
    $('html,body').addClass('stop-scrolling');
    win.trigger('scroll');
    setTimeout(function(){ win.trigger('scroll'); },300);
};

function resumeScrolling(){
    $('html,body').removeClass('stop-scrolling');
    wrap.attr('style','');
    win.scrollTop(oldScrollPos);
};

function resizeStopScrolling(){
	if (body.hasClass('stop-scrolling')) {
		wrap.css('width',win.width());
	}

	if(body.hasClass('show-mob-menu')){
		if(win.width() > 1330){
			$('.mob-menu-btn').click();
		}
	}
};



var notificationActive = false,
	notificationTimeout,
	closeNotificationTimeout,
	removeNotificationTimeout,
	notification = $('.notification');

function doNotification(text){
	if(!notificationActive){
		notificationActive = true;
		$('body').append('<div class="notification"><p>'+text+'</p></div>');

		setTimeout(function(){ 
			$('.notification').addClass('show'); 
		}, 50);

		closeNotificationTimeout = setTimeout(function(){ 
			$('.notification').removeClass('show'); 
		}, 4000);

		removeNotificationTimeout = setTimeout(function(){ 
			$('.notification').remove(); 
			notificationActive = false; 
		}, 4400);

	}
}

function closeNotification() {
	doc.on('click', '.notification', function() {
		var thisNotification = $('.notification');
		thisNotification.removeClass('show');
		clearTimeout(notificationTimeout);
		clearTimeout(closeNotificationTimeout);
		clearTimeout(removeNotificationTimeout);
		notificationTimeout = setTimeout(function(){
			thisNotification.remove();
			notificationActive = false;
		}, 200);
	});
}




