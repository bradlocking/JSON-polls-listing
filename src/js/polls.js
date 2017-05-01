doc.ready(function(){
	fingerPrint.init();
	pollsComponent.init();
});

// Initialize Firebase
var firebaseConfig = {
	apiKey: "AIzaSyDnDtxdrJR4YjafrPHRDqHhtjgq3x7Ajj0",
	authDomain: "json-polls-listing.firebaseapp.com",
	databaseURL: "https://json-polls-listing.firebaseio.com",
	projectId: "json-polls-listing",
	storageBucket: "json-polls-listing.appspot.com",
	messagingSenderId: "587327739892"
};
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
var fDatabase = firebase.database();

var fingerPrint = {
	// presume that current visitor does not exist in DB. 
	userExists: false,
	userFingerprint: null,

	// Get the Unique ID of the visitor.
	init: function() {
		fingerPrint.detectFingerprint();
	},

	detectFingerprint: function() {
		var userFingerprint;

		var options = {
			excludeAdBlock: true,
		}

		// Get fingerprint of user
		new Fingerprint2(options).get(function(result, components){
			// A hash, representing your device fingerprint
			fingerPrint.userFingerprint = result;
		});
	},


	updateAnswer: function(pollID, selectedAnswer) {
		// Update the state of the user in the database to include the newly voted poll question
		fDatabase.ref('pollSubmitters').child(fingerPrint.userFingerprint).update({
			[pollID]: selectedAnswer
		});
	},


	addAnswer: function(pollID, selectedAnswer) {
		fDatabase.ref('/pollSubmitters/' + fingerPrint.userFingerprint).once('value').then(function(snapshot) {
			if (!snapshot.hasChild(pollID)) {
				fingerPrint.updateAnswer(pollID, selectedAnswer);
			} else {
				doNotification('You have already submitted to this poll and your answer will not be counted');

				// Turn the answers from the DB into a string to store on the users browser.
				var userAnswers = JSON.stringify(snapshot.toJSON());

				// Lastly, stringify all the answers and update localStorage. 
				localStorage.setItem('poll-submissions', userAnswers);
			}
		});
	}
}



var pollsComponent = {

	pollMarkup: '',
	pollStorage: '',

	init: function() {
		pollsComponent.getJSON();
		pollsComponent.changeEvent();
		pollsComponent.listingNavigation();
		pollsComponent.checkLocalStorage();
	},

	getJSON: function() {
		$.getJSON('src/polls/pollData.js', function(pollData) {
		    // Get the data from external json file and store poll questions
		    pollQuestions = pollData;

		    pollsComponent.pollLoop();
		    pollsComponent.pollListingModal();
		    pollsComponent.checkIfAnswered();
		});
	},

	checkLocalStorage: function() { 
		pollsComponent.pollStorage = localStorage.getItem('poll-submissions');

		// If there are polls stored, add existing submission to answeredPolls variable
		if (pollsComponent.pollStorage) {
			pollsComponent.pollStorage = JSON.parse(pollsComponent.pollStorage);
		}
	},

	checkIfAnswered: function() {
		// If there are polls stored, add existing submissiont to answeredPolls variable
		if (pollsComponent.pollStorage) {
			var currentPollSubmissions = pollsComponent.pollStorage;
		}

		// Loop each answer in object and remove style poll accordingly
		// console.log(currentPollSubmissions);
		for (var key in currentPollSubmissions) {
		  if (currentPollSubmissions.hasOwnProperty(key)) {

		  	// get the Current Poll
			var thisPollQuestion = pollQuestions['poll-questions'][key],
				currentPoll = $('.polls-widget__poll[data-poll-id="'+key+'"]'),
				thisPollAnswer = currentPollSubmissions[key],
				totalVotes = thisPollQuestion['total-votes'];

				// Add closed classes to polls widget
				currentPoll.addClass('polls-widget--answered polls-widget--closed');

				// Remove inputs so form cannot be submitted.
				currentPoll.find('input').remove();	

				// Display results of poll 
			    pollsComponent.displayPollResults(currentPoll, thisPollQuestion, totalVotes);

		    // Add class of answered to the user submitted answer. 
		    currentPoll.find('.poll-answer[data-answer-id="'+ thisPollAnswer +'"]').addClass('poll-answer--answered');
		  }
		}
	},

	pollLoop: function() {
		$('.polls-widget__poll, .polls-archive__listing a').each(function() {
			var thisPoll = $(this),
				closedPollID = thisPoll.attr('data-poll-id');

			if (thisPoll.hasClass('polls-widget--closed')) {
				pollsComponent.closedPoll(thisPoll, closedPollID);
			} else if (thisPoll.hasClass('poll-archive-item')) {
				pollsComponent.pollArchiveDisplay(thisPoll, closedPollID)
			}
		});
	},

	pollArchiveDisplay: function(currentPoll, pollID) {
		var thisPollQuestion = pollQuestions['poll-questions'][pollID];

		currentPoll.find('.poll-bars > li').each(function() {
			// store this in variable
			var thisAnswer = $(this);
			
			// Get the id for this answer
			var answerID = thisAnswer.attr('data-answer-id');

			// Get total number of votes for question
			var totalVotes = JSON.parse(thisPollQuestion['total-votes']);

			// Get number of votes for this answer
			var numberOfVotes = JSON.parse(thisPollQuestion['poll-answers'][answerID]['votes']);

			// Apply height to the garph bar based on percentage. 
			thisAnswer.attr('style', 'max-height:'+ (100 / totalVotes) * numberOfVotes +'%;')
		});
	},

	listingNavigation: function() {
		$('body').on('click', '.poll-newer, .poll-older', function(e) {
			e.preventDefault();

			// Get ID of current poll in modal.
			var currentPollID = $(pollsComponent.pollMarkup).find('.polls-widget__poll').attr('data-poll-id');

			// Check position of poll in listing
			listingPosition = $('.poll-archive-item[data-poll-id="' + currentPollID + '"]');

			// Check what button is being pressed and navigate back and forth accordingly
			if ($(this).hasClass('poll-newer')) {
				var pollToShow = listingPosition.prev();
			} else if ($(this).hasClass('poll-older')) {
				var pollToShow = listingPosition.next();
			}

			// Build the markup which will be placed into the modal.
			pollsComponent.buildModalMarkup(pollToShow);

			// Display the poll which is one previous to this.
			setTimeout(function() {
				$(".ui-overlay .polls-widget").replaceWith(pollsComponent.pollMarkup);
			}, 50);

			setTimeout(function() {
				$('.ui-overlay').find('.polls-widget__poll').addClass('polls-widget--answered');
				$('.ui-overlay').find('.polls-widget').removeClass('prevent-poll-animations');
				
				// Get ID for new poll in Modal
				newPollID = $(".ui-overlay .polls-widget__poll").attr('data-poll-id');

				// If this poll exists in the localstorage, highlight their selected answer
				if (pollsComponent.pollStorage[newPollID]) {
					$('.ui-overlay').find('.poll-answer[data-answer-id="'+  pollsComponent.pollStorage[newPollID] +'"]').addClass('poll-answer--answered');
				}
			}, 300);
		});
	},

	pollListingModal: function() {
		$('.poll-archive-item').on('click', function(e) {
			e.preventDefault();

			// store this in variable
			var thisPoll = $(this);

			pollsComponent.buildModalMarkup(thisPoll);

			var afterPollDisplay = function() {
				$('.ui-overlay').find('.polls-widget__poll').addClass('polls-widget--answered');
				$('.ui-overlay').find('.polls-widget').removeClass('prevent-poll-animations');

				// If this poll exists in the localstorage, highlight their selected answer
				if (pollsComponent.pollStorage !== null) {
					$('.ui-overlay').find('.poll-answer[data-answer-id="'+  pollsComponent.pollStorage[thisPoll.attr('data-poll-id')] +'"]').addClass('poll-answer--answered');
				}
			};

			var options = { 
		        pollData: pollsComponent.pollMarkup,
		        buttons: [
		            { text: '<i class="fa fa-times"></i>', action: 'close-dialog' }
		        ],
		        data: [
		            { label: 'poll-id', value: '' },
		            { label: 'state-change', value: '' }
		        ],
		    };
		    newDialog(options, afterPollDisplay); 

		});
	},

	buildModalMarkup: function(thisPoll) {
		var pollID 				= thisPoll.attr('data-poll-id'), // Get the id for this answer
			thisPollQuestion    = pollQuestions['poll-questions'][pollID], // Retrieve the clicked poll question
			pollAnswers 		= thisPollQuestion['poll-answers'], // Retrieve all of the answers from the selected object 
			pollCloseDate 		= thisPoll.attr('data-close-date'); // The close date for the answer 

		// Build the markup for the poll
		pollsComponent.pollMarkup =  '<div class="widget-container polls-widget prevent-poll-animations">'
						+ '<div class="container container--small">' 
					    	+ '<h5>Final Results - '+ pollCloseDate +'</h5>' 
					    	+ '<h4>'+ thisPollQuestion['question'] +'</h4>' 
					    	+ '<div class="polls-widget__poll polls-widget--closed" data-poll-id="'+pollID+'">';


		// Loop each answer and output what is required.
		var answerID = -1;
		for (var answer in pollAnswers) {

			// Increment Answer ID
			answerID++

			if (pollAnswers.hasOwnProperty(answer)) {

				// This stores the object for the poll answer
				var theAnswer = pollAnswers[answer];

				// The percentage of the answer 
				var votePercentage = parseInt(((100 / thisPollQuestion['total-votes']) * theAnswer['votes']) * 100 / 100);

				// create the markup for each answer
				pollsComponent.pollMarkup  += '<p class="poll-answer" data-answer-id="'+answerID+'">'
								+  '<span class="poll-answer__label">'
									+  '<label>'
										+  '<span class="poll-answer__chart" style="width:' + votePercentage + '%"></span>'
										+  '<span class="poll-answer__text">'+ theAnswer['answer'] +'</span>'
										+  '<span class="poll-answer__percentage"><span>' +votePercentage + '</span>%</span>'
									+  '</label>'
								+  '</span>'
							+  '</p>'
			}
		}

		// Close the tags for the poll
		pollsComponent.pollMarkup += '</div>';

		// Check the position of the poll in listing
		var currentPollID = $(pollsComponent.pollMarkup).find('.polls-widget__poll').attr('data-poll-id'),
			listingPosition = $('.polls-archive__listing').find('.poll-archive-item[data-poll-id="' + currentPollID + '"]');

		// if current poll is first or last in listing, remove newer or older button.
		if (listingPosition.is(':first-child')) {
			pollsComponent.pollMarkup += '<a href="" class="button poll-older"><span>Older</span></a>';
		} else if (listingPosition.is(':last-child')) {
			pollsComponent.pollMarkup += '<a href="" class="button poll-newer"><span>Newer</span></a>';
		} else {
			pollsComponent.pollMarkup += '<a href="" class="button poll-newer"><span>Newer</span></a><a href="" class="button poll-older"><span>Older</span></a>';
		}

		pollsComponent.pollMarkup += '</div></div>';
	},

	closedPoll: function(currentPoll, pollID) {
		var thisPollQuestion = pollQuestions['poll-questions'][pollID];

		var totalVotes = JSON.parse(thisPollQuestion['total-votes']);

		pollsComponent.displayPollResults(currentPoll, thisPollQuestion, totalVotes);
	},

	displayPollResults: function(poll, thisPollQuestion, totalVotes) {
		// Loop through each input and apply percentage based on results
		poll.find('.poll-answer').each(function() {
			// Get parent wrapper of input
			var thisAnswer = $(this);

			// Get the ID of the answer relating to the JSON
			var answerID = thisAnswer.attr('data-answer-id');

			// Get number of votes for this answer
			var numberOfVotes = JSON.parse(thisPollQuestion['poll-answers'][answerID]['votes']);

			// Check if the input is checked or not
			if(thisAnswer.find('input[type="radio"]').is(':checked')) { 
				// work out percentage of votes for checked answer based
				var votePercentage = (100 / totalVotes) * (numberOfVotes + 1);

				// Add answered class to selected input
				thisAnswer.addClass('poll-answer--answered');
			} else {
				var votePercentage = (100 / totalVotes) * numberOfVotes;
			}

			// Apply correct percentage to markup which will display
			var visualPercentage = parseInt(votePercentage * 100 / 100);
			thisAnswer.find('.poll-answer__percentage span').html(visualPercentage);

			// Apply percentage to width of the answer graph (pretty visual effect)
			thisAnswer.find('.poll-answer__chart').attr('style','width:'+votePercentage+'%;');

			// Add answered class to entire poll widget
			poll.parent().addClass('polls-widget--answered');

			// Add 'disabled' to all inputs, preventing re-vote (for good measure)
			thisAnswer.find('input').attr('disabled', 'disabled');
		});
	},

	changeEvent: function() {
		$('.polls-widget__poll').on('change', 'input[type="radio"]', function() {
			var thisPoll 		  = $(this).closest('form'), // Parent Form
				pollID 			  = thisPoll.attr('data-poll-id'), // Get the Id of the poll
				thisPollQuestion  = pollQuestions['poll-questions'][pollID],
				totalVotes 		  = JSON.parse(thisPollQuestion['total-votes']) + 1; // Get the total number of votes and add one (as the user just answered)

			pollsComponent.displayPollResults(thisPoll, thisPollQuestion, totalVotes);

			// Check if there are any polls in localstorage
			var answeredPolls = {};

			// If there are polls stored, add existing submission to answeredPolls variable
			if (pollsComponent.pollStorage) {
				answeredPolls = pollsComponent.pollStorage;
			}

			var selectedAnswer = $(this).parent().attr('data-answer-id');

			// Get the current poll and the id of the answer selected and add to JSON object.
			answeredPolls[pollID] = selectedAnswer

			// Lastly, stringify all the answers and update localStorage. 
			localStorage.setItem('poll-submissions', JSON.stringify(answeredPolls));

			// Check if answer exists in Firebase and add/refuse to add accoringly.
			fingerPrint.addAnswer(pollID, selectedAnswer);
		});
	}
};