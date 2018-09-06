'use strict';


const fs = require('fs');
const resolve = require('resolve');

// In order to maintain consistent global scope across the files,
// and share natives like Array, etc, We will eval things within our sandbox
function requireval(path) {
  const res = resolve.sync(path, {basedir: __dirname});
  const filesrc = fs.readFileSync(res, 'utf8');
  eval(filesrc + '\n\n//# sourceURL=' + path);
}

// establish our sandboxed globals
this.window = this.self = this.global = this;
this.console = console;

// establish our sandboxed globals
this.Runtime = class {};
this.Protocol = class {};
this.TreeElement = class {};

const self = this;
self.HeapSnapshotWorker = {};
self.Common = {UIString: x=>x};
const runtime = {queryParam:()=>false};
self.Runtime = runtime;
self.addEventListener = ()=>{}

// from generated externs.
// As of node 7.3, instantiating these globals must be here rather than in api-stubs.js
this.Accessibility = {};
this.Animation = {};
this.Audits = {};
this.Audits2 = {};
this.Audits2Worker = {};
this.Bindings = {};
this.CmModes = {};
this.Common = {};
this.Components = {};
this.Console = {};
this.DataGrid = {};
this.Devices = {};
this.Diff = {};
this.Elements = {};
this.Emulation = {};
this.Extensions = {};
this.FormatterWorker = {};
this.Gonzales = {};
this.HeapSnapshotWorkerDispatcher = {};
this.HeapSnapshotModel = {};
this.Runtime = {};
this.Host = {};

this.LayerViewer = {};
this.Layers = {};
this.Main = {};
this.Network = {};
this.Persistence = {};
this.Platform = {};
this.Protocol = {};
this.Profiler = {};
this.Resources = {};
this.Sass = {};
this.Screencast = {};
this.SDK = {};
this.Security = {};
this.Services = {};
this.Settings = {};
this.Snippets = {};
this.SourceFrame = {};
this.Sources = {};
this.Terminal = {};
this.TextEditor = {};
this.Timeline = {};
this.TimelineModel = {};
this.ToolboxBootstrap = {};
this.UI = {};
this.UtilitySharedWorker = {};
this.WorkerService = {};
this.Workspace = {};


requireval('./lib/api-stubs.js');

// chrome devtools frontend
requireval('chrome-devtools-frontend/front_end/common/Object.js');
requireval('chrome-devtools-frontend/front_end/platform/utilities.js');
requireval('chrome-devtools-frontend/front_end/common/ParsedURL.js');
requireval('chrome-devtools-frontend/front_end/common/UIString.js');
requireval('chrome-devtools-frontend/front_end/sdk/Target.js');
requireval('chrome-devtools-frontend/front_end/sdk/LayerTreeBase.js');
requireval('chrome-devtools-frontend/front_end/common/SegmentedRange.js');
requireval('chrome-devtools-frontend/front_end/bindings/TempFile.js');
requireval('chrome-devtools-frontend/front_end/sdk/TracingModel.js');
requireval('chrome-devtools-frontend/front_end/sdk/ProfileTreeModel.js');
requireval('chrome-devtools-frontend/front_end/timeline/TimelineUIUtils.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineJSProfile.js');
requireval('chrome-devtools-frontend/front_end/sdk/CPUProfileDataModel.js');
requireval('chrome-devtools-frontend/front_end/layers/LayerTreeModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineModel.js');
requireval('chrome-devtools-frontend/front_end/data_grid/SortableDataGrid.js');

requireval('chrome-devtools-frontend/front_end/timeline/TimelineTreeView.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineProfileTree.js');
requireval('chrome-devtools-frontend/front_end/sdk/FilmStripModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineIRModel.js');
requireval('chrome-devtools-frontend/front_end/timeline_model/TimelineFrameModel.js');
/* Added required requireval calls for heap snapshot parsing  */
requireval('chrome-devtools-frontend/front_end/heap_snapshot_model/HeapSnapshotModel.js');
requireval('chrome-devtools-frontend/front_end/sdk/HeapProfilerModel.js');
requireval('chrome-devtools-frontend/front_end/heap_snapshot_worker/HeapSnapshot.js');
requireval('chrome-devtools-frontend/front_end/heap_snapshot_worker/HeapSnapshotLoader.js');
requireval('chrome-devtools-frontend/front_end/heap_snapshot_worker/HeapSnapshotWorkerDispatcher.js');
requireval('chrome-devtools-frontend/front_end/heap_snapshot_worker/HeapSnapshotWorker.js');
// requireval('chrome-devtools-frontend/front_end/profiler/HeapSnapshotView.js');

// minor configurations
requireval('./lib/devtools-monkeypatches.js');

// polyfill the bottom-up and topdown tree sorting
requireval('./lib/timeline-model-treeview.js');

class SandboxedModel {
  init(event) {
    
  console.log("Computing snapshot from " + event.src + " with " + event.dest);
   //Reading snapshot from files   
   const heapDump = JSON.parse((fs.readFileSync('./memoryProfiles/snapshot_' + event.src + '.json')));
   const secondHeapDump =  JSON.parse(fs.readFileSync('./memoryProfiles/snapshot_' + event.dest + '.json'));

   //Get parsed data from the JSHeapSnapshot class for both snapshots
   this._heap_model = new HeapSnapshotWorker.JSHeapSnapshot(heapDump,new HeapSnapshotWorker.HeapSnapshotProgress());
   this._second_heap_model = new HeapSnapshotWorker.JSHeapSnapshot(secondHeapDump,new HeapSnapshotWorker.HeapSnapshotProgress());

   //Initialize both models to calculate appropriate data metrics
   this._heap_model.initialize();
   this._second_heap_model.initialize();

   //Create aggregate Stats to take diff
   const firstAgg = this._heap_model.aggregatesForDiff();
   const firstSnapName  = 'firstSnap';

   //Using first snapshot as base, calulcate the diffs on aggreagates
   var heapSnapDiff =  this._second_heap_model.calculateSnapshotDiff(firstSnapName,firstAgg);
    getComputeHeapDiffDump(heapSnapDiff, event.src, event.dest, event.init);
  }
}

function getComputeHeapDiffDump(heapSnapDiff, src, dest, init){
  var counter=0;
  var diffArr = [];
  let totalMemoryChange = 0

  /*Loop through all values in the diff taking non V8 values and pushing into diffArr */
  Object.keys(heapSnapDiff).forEach(function(key,index) {
    if(key.indexOf('(')!=0){
      const obj = heapSnapDiff[key];
      const diffObj = {
        name: key,
        increaseInCount:obj.addedCount,
        decreaseInCount:obj.removedCount,
        increaseInSize:obj.addedSize,
        decreaseInSize:obj.removedSize,
        countChange: obj.countDelta,
        sizeChange: obj.sizeDelta
      };
      //Add all objects in the diff dump for total size of component
      totalMemoryChange += diffObj.sizeChange;
      console.log(diffObj)
      diffArr.push(diffObj);
    }
  });
  console.log("Total memory change: "  + totalMemoryChange )
  var str = "heapDiffDump_" + src + "_" + dest;
  if(init)
    fs.writeFileSync('./memoryProfiles/heapDiffDump.json', 'heapDiffDump = \'' + JSON.stringify({'Delta': diffArr,'sizeChange': totalMemoryChange}) + '\'');

  fs.writeFileSync('./memoryProfiles/heapDiffDump_' + src + '_' + dest +'.json', str +' = \'' + JSON.stringify({'Delta': diffArr,'sizeChange': totalMemoryChange}) + '\'');
}

var sandboxedModel = new SandboxedModel();
// no exports as we're a sandboxed/eval'd module.
