// ES-module entry point for the Groove Scribe authoring app (index.html).
//
// Historically index.html loaded groove_writer/groove_utils/grooves as classic
// <script> tags and built its dynamic DOM at parse time with document.write()
// against the synchronous globals. Under native ES modules (which are deferred),
// that no longer works, so this module owns the bootstrap: it imports the app,
// re-exposes the public API on window for the inline HTML onclick handlers, and
// builds the same dynamic DOM into placeholder containers after parse.

import { GrooveWriter } from './groove_writer.js';
import { GrooveUtils } from './groove_utils.js';
import { grooves } from './grooves.js';

// Inline HTML handlers (onclick="myGrooveWriter.…") and other consumers still
// reference these as globals, so expose them on window.
window.GrooveWriter = GrooveWriter;
window.GrooveUtils = GrooveUtils;
window.grooves = grooves;

const myGrooveWriter = new GrooveWriter();
window.myGrooveWriter = myGrooveWriter;
const utils = myGrooveWriter.myGrooveUtils;

// Conditional stylesheets (previously injected via document.write in <head>).
function addStylesheet(href) {
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = href;
  document.head.appendChild(link);
}
if (utils.grooveDBAuthoring) {
  addStylesheet('css/grooveDB_authoring.css');
}
if (utils.debugMode) {
  addStylesheet('css/groove_debug.css');
}

// Replace a placeholder element with real markup (exact replacement, no wrapper).
function replaceSlot(id, html) {
  const el = document.getElementById(id);
  if (el) el.outerHTML = html;
}
// Fill a container element's contents (matches document.write into that element).
function fillContainer(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

// Conditional left-nav buttons.
if (!utils.grooveDBAuthoring) {
  replaceSlot(
    'viewEditSwitchSlot',
    '<span class="left-button" onclick="myGrooveWriter.swapViewEditMode();">' +
    '<span class="left-button-content"><span id="view-edit-switch">Switch to EDIT mode</span></span></span>'
  );
}
if (utils.is_touch_device()) {
  replaceSlot(
    'advancedEditSlot',
    '<span class="left-button edit-block" id="advancedEditAnchor" ' +
    'onclick="event.preventDefault(); myGrooveWriter.toggleAdvancedEdit()">' +
    '<span class="left-button-content">Advanced Edit</span></span>'
  );
}

// Dynamic content regions previously built with document.write.
fillContainer('PermutationOptions', myGrooveWriter.HTMLforPermutationOptions());

let gridHTML = '';
var sectionStarts = myGrooveWriter.getSectionStartMeasures();
for (let cur_measure = 1; cur_measure <= myGrooveWriter.numberOfMeasures(); cur_measure++) {
  var sectionIndexStartingHere = sectionStarts.indexOf(cur_measure);
  if (sectionIndexStartingHere !== -1) {
    if (sectionIndexStartingHere !== 0) {
      // close out the previous section with its own "add measure" button,
      // and start a visual break -- skipped for the very first section,
      // which has nothing above it to break away from
      gridHTML +=
        '<span class="add-measure-to-section-button" title="Add measure" onClick="myGrooveWriter.addMeasureToSectionButtonClick(event, ' +
        (sectionIndexStartingHere - 1) +
        ')"><i class="fa fa-plus"></i></span>';
      gridHTML += '<div class="section-break"></div>';
    }

    var section = myGrooveWriter.sectionBreaks()[sectionIndexStartingHere];
    console.log("section", section);
    gridHTML +=
      '<input type="text" class="section-description-input" value="' +
      section.description.replace(/"/g, '&quot;') +
      '" onChange="myGrooveWriter.sectionDescriptionChanged(event, ' +
      sectionIndexStartingHere +
      ')">';

  }

  gridHTML += myGrooveWriter.HTMLforStaffContainer(cur_measure, (cur_measure - 1) * myGrooveWriter.notesPerMeasure());

  gridHTML += '<span id="addMeasureButton" title="Add measure" onClick="myGrooveWriter.addMeasureButtonClick(event)"><i class="fa fa-plus"></i></span>';
  gridHTML += '<span id="addIndependentBlockButton" title="Add independent rhythm block" onClick="myGrooveWriter.addIndependentBlockButtonClick(event)"><i class="fa fa-plus-square"></i></span>';
}
fillContainer('measureContainer', gridHTML);

fillContainer('grooveListWrapper', grooves.getGroovesAsHTML());

// Initialize the notes/player once the page has fully loaded (matches the
// original window.onload handler).
window.addEventListener('load', function () {
  myGrooveWriter.runsOnPageLoad();
});
