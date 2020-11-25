/*
 * Code Pulse: A real-time code coverage testing tool. For more information
 * see http://code-pulse.com
 *
 * Copyright (C) 2014 Applied Visions - http://securedecisions.avi.com
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

$(document).ready(function(){

	switch(window.location.hash){
		case '#import':
			$('a[href=#new-import-form]').tab('show')
	}

	// wire up the new analysis form to submit to the project creation url, with a mandatory name
	setupUploadForm($('#new-analysis-form'), '/api/project/create', false)

	// wire up the new import form to submit to the project import url, with an optional name
	setupUploadForm($('#new-import-form'), '/api/project/import', true)

	function setupUploadForm($form, uploadUrl, nameOptional){
		/*
		 * Find all of the elements from the form so we can use them later.
		 */
		var fileInput = $form.find('[name=file-input]'),
			nameInput = $form.find('[name=name-input]'),
			fileInputArea = $form.find('.file-input-area'),
			fileChoiceLabel = $form.find('[name=file-input-choice-label]'),
			fileChoiceOriginalText = fileChoiceLabel.text(),
			fileClearButton = $form.find('.file-input-clear'),
			fileDropzone = $form.find('.file-dropzone'),
			cancelButton = $form.find('[name=cancel-button]'),
			submitButton = $form.find('[name=submit-button]'),
			nameFeedbackArea = $form.find('[name=name-feedback]'),
			fileFeedbackArea = $form.find('[name=file-feedback]')

		/*
		 * Set the current state of the form (`name` and `fileData`) to null, initially.
		 */
		var projectFile = new Bacon.Model(null)
		var projectName = new Bacon.Model('')

		var isUploading = new Bacon.Model(false)

		/*
		 * Set the `currentFeedback` to an empty object. As errors and warnings w.r.t.
		 * the form start appearing, they will be stored in this object, for display.
		 */
		var currentFeedback = {}

		/*
		 * Clear the form when the cancel button is clicked.
		 */
		cancelButton.click(clearForm)

		/*
		 * Typing in the nameInput field will update the `projectName`.
		 */
		nameInput.asEventStream('input').onValue(function(){
			var value = nameInput.val().trim()
			projectName.set(value)
		})

		/*
		 * Set up the fileInput using the jQuery file upload plugin.
		 * Don't submit files for upload immediately; submission is
		 * done when the user clicks OK and the form passes validation.
		 */
		fileInput.fileupload({
			url: uploadUrl,
			dropZone: fileDropzone,
			add: function(e, data){

				$.ajax('/api/user-settings', {
					error: function(xhr, status){
						alert('Unable to fetch user settings that affect file upload')
						projectFile.set(null)
					},
					success: function(userSettings){
						if (data.files[0].size > userSettings.maxFileUploadSizeBytes) {
							alert('The file you specified exceeds the maximum file size (' + userSettings.maxFileUploadSizeBytes / (1024*1024) + ' MB).')
							projectFile.set(null)
							return
						}

						// use this `data` as the current file data.
						// this will be used once the form is submitted.
						projectFile.set(data)
					}
				})
			},
			formData: function(){
				var name = projectName.get()
				if(!name) return []
				else return [{name: 'name', value: name}]
			},
			done: function(e, data){
				onSubmitDone(data.result)
			},
			error: function(e, data){
				onSubmitError(e.responseText)
			}
		})

		var projectFileName = projectFile.property.map(function(data){
			if(data && data.files && data.files.length){
				return data.files[0].name
			} else {
				return null
			}
		})

		projectFileName.onValue(function(filename){
			fileChoiceLabel.text(filename || fileChoiceOriginalText)
			fileClearButton[filename ? 'show' : 'hide']()
			fileInputArea[filename ? 'slideUp' : 'slideDown']('fast')
		})

		fileClearButton.click(function(){ projectFile.set(null) })

		projectFileName.onValue(function(filename){
			if(filename && !projectName.get() && !nameOptional){
				projectName.set(filename)
				nameInput.val(filename)
			}
		})

		/*
		 * Alternate code path to sending the data to the server, used
		 * when Code Pulse is being run as an embedded node-webkit app.
		 * It sends the `path` and `projectName` to the server, assuming
		 * that the server is on the same machine, so it has read access
		 * to the file at that path.
		 */
		function doNativeUpload(path){
			console.log('using native upload behavior on ', path)
			$.ajax(uploadUrl, {
				data: {'path': path, name: projectName.get()},
				type: 'POST',
				error: function(xhr, status){ onSubmitError(xhr.responseText) },
				success: function(data){ onSubmitDone(data) }
			})
		}

		/*
		 * Callback for when the file upload (both native and browser-based)
		 * encounters an error when trying to contact the server.
		 */
		function onSubmitError(err){
			isUploading.set(false)
			alert('Error: ' + (err || '(unknown error)'))
		}

		/*
		 * Callback for when the file upload (both native and browser-based)
		 * finishes. The result is expected to contain a `href` field that
		 * tells the client the URL of the newly-created project. The page will
		 * automatically be redirected to that location.
		 */
		function onSubmitDone(result){
			isUploading.set(true)
			window.location.href = result.href
		}

		/*
		 * Set the `fileDropzone` so that it gets the `in` class while the
		 * user is dragging a file over the page, and the `hover` class when
		 * the drag goes over the drop zone itself.
		 */
		;(function setupDropZone(){
			var timeout = undefined

			$(document).bind('dragover', function(e){
				if(!isFileDrag(e)) return

				if(!timeout) fileDropzone.addClass('in')
				else clearTimeout(timeout)

				// figure out if we're dragging over the dropzone
				var found = false, node = e.target
				do {
					if(node === fileDropzone[0]){
						found = true
						break
					}
					node = node.parentNode
				} while(node != null)

				// set the 'hover' class depending on `found`
				fileDropzone.toggleClass('hover', found)

				timeout = setTimeout(function(){
					timeout = null
					fileDropzone.removeClass('in hover')
				}, 300)
			})
		})()

		/*
		 * Check if a drag event contains a file. We don't care about
		 * drag/drop events if they don't have files.
		 */
		function isFileDrag(event) {
			if(event.originalEvent) return isFileDrag(event.originalEvent)
			
			var dt = event.dataTransfer
			
			// can't use forEach or $.inArray because IE10 uses a DomStringList
			var foundFiles = false, idx
			for(idx = 0; idx < dt.types.length; idx++){
				var s = dt.types[idx]
				if(s == 'Files') foundFiles = true
			}
			
			return dt && foundFiles 
		}

		/*
		 * Create an event stream that represents the value of the
		 * name input; it is updated 500ms after the latest change
		 * to the input, and yields the trimmed version.
		 */
		var nameInputValues = nameInput.asEventStream('input')
			.map(function(){ return nameInput.val().trim() })
			.toProperty()
			.noLazy()

		/*
		 * As the name changes, ask the server if the latest name
		 * would conflict with the name of an existing project. Set
		 * the 'name-conflict' feedback warning accordingly.
		 */
		projectName.changes
			.debounce(300)
			.flatMapLatest(function(name){
				return Bacon.fromNodeCallback(function(callback){
					checkNameConflict(name, callback)
				})
			})
			.onValue(function(hasNameConflict){
				if(hasNameConflict){
					setFeedback('name-conflict', 'Another project has the same name', 'warning')
				} else {
					setFeedback('name-conflict', null)
				}
			})

		/*
		 * If the name is manditory, set the 'name-empty' feedback
		 * error if the name becomes blank after the user had already
		 * typed something (e.g. they deleted what they typed).
		 */
		if(!nameOptional) projectName.changes
			.skipWhile(function(name){ return !name.length })
			.map(function(name){ return !name.length })
			.onValue(function(isEmpty){
				if(isEmpty){
					setFeedback('name-empty', 'The name cannot be blank', 'error')
				} else {
					setFeedback('name-empty', null)
				}
			})

		/*
		 * Combine the various form inputs as an object
		 * in a baconjs Property.
		 */
		var submissionCriteria = Bacon.combineTemplate({
			name: projectName.property,
			fileData: projectFile.property
		})

		/*
		 * Check a submissionCriteria object to see if it
		 * should be allowed for submission.
		 */
		function checkSubmissionCriteria(criteria){
			var hasValidName = nameOptional || criteria.name
			return hasValidName && criteria.fileData
		}

		/*
		 * Represent the current form state as whether or not it can
		 * be submitted.
		 */
		var canSubmitForm = submissionCriteria.map(checkSubmissionCriteria)

		/*
		 * Set the 'disabled' class on the submit button depending on the
		 * state of the `canSubmitForm` property.
		 */
		canSubmitForm.not().assign(submitButton, 'toggleClass', 'disabled')

		/*
		 * When the submit button is clicked, if the form is allowed to be
		 * submitted, do the submission. Depending on whether CodePulse is
		 * being run in a browser or as an embedded node-webkit app, the
		 * actual submission mechanism will be different.
		 */
		submissionCriteria
			.sampledBy(submitButton.asEventStream('click'))
			.filter(canSubmitForm)
			.filter(isUploading.property.not())
			.onValue(function(criteria){

				var file = criteria.fileData.files[0],
					filepath = file.path

				isUploading.set(true)
				if(CodePulse.isEmbedded && filepath){
					// native upload behavior
					doNativeUpload(filepath)
				} else {
					// browser upload behavior
					criteria.fileData.submit()
				}
			})

		isUploading.property.onValue(function(b){
			submitButton.overlay(b ? 'wait' : 'ready')
		})

		/*
		 * Ask the server if there will be a name conflict with the given `name`.
		 * The `callback` is a `function(error, result)` in the style of node.js,
		 * because this function is intended to be used with Bacon.fromNodeCallback.
		 */
		function checkNameConflict(name, callback){
			$.ajax('/api/check-name-conflict', {
				data: {'name': name},
				type: 'GET',
				success: function(data){
					callback(null, data == 'true')
				},
				error: function(xhr, status){
					callback(xhr.responseText, null)
				}
			})
		}

		/*
		 * Modify the `currentFeedback` object by adding or removing the
		 * entry associated with the given `category`. If `message` is defined,
		 * a feedback object will be created with the `message` and optional
		 * `type`. If not, the feedback object will be null. After modifying
		 * the `currentFeedback` object, a list of "feedbacks" is created and
		 * sent to the UI via updateFeedbackUI.
		 */
		function setFeedback(category, message, type){
			var feedbackObj = message ? {message: message, type: type} : null
			currentFeedback[category] = feedbackObj

			var nameFeedbacks = [
				currentFeedback['name-conflict'],
				currentFeedback['name-empty']
			].filter(function(d){ return !!d })

			updateFeedbackUI(nameFeedbackArea, nameFeedbacks)

			// TODO: add file feedbacks
		}

		/*
		 * Set the feedback messages for the given $feedbackArea jQuery element.
		 * The `feedbackList` argument is expected to be an array of objects in the form of:
		 * `{message: <Any String>, type: ['error'|'warning'|undefined]}`
		 */
		function updateFeedbackUI($feedbackArea, feedbackList){
			var selection = d3.select($feedbackArea[0]).selectAll('.feedback').data(feedbackList)

			selection.exit().remove()
			selection.enter().append('div')

			selection
				.text(function(d){ return d.message })
				.attr('class', function(d){
					var t = d.type
					if(!t) return 'feedback'
					else return 'feedback ' + t
				})
		}

		/*
		 * Clears the form by setting the `currentX` variables to their initial states
		 * and resetting the input and feedback UI elements.
		 */
		function clearForm(){
			projectName.set('')
			projectFile.set(null)
			currentFeedback = {}

			nameInput.val('')
			updateFeedbackUI(nameFeedbackArea, [])
			updateFeedbackUI(fileFeedbackArea, [])
		}
	}

})
