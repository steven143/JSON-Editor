/**
 * MAIN FUNCTIONALITY OF JSON EDITOR
 * 
 * Creator: @solvedDev
 * Project: JSON Editor
 */

//OPTIONS
var options = {
	edit_all: false,
	auto_completions: true
};


//APPLICATION
class Application {
	constructor() {
		this.loading_screen = new LoadingScreen();
		this.mobile_screen = new MobileScreen();

		this.parser = new Parser();
		this.loading_system = new LoadingSystem(this);
	}

	start() {
		var is_mobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
		if(is_mobile || window.innerWidth <= 800 && window.innerHeight <= 600){
			console.log("found")
			this.openScreen(this.mobile_screen);
		} else {
			this.openScreen(this.loading_screen);
			console.log("No mobile device detected. Loading data...");

			//Register events
			this.loading_system.onReady = function(pSelf) {
				pSelf.editor_screen = new EditorScreen(this, pSelf.loading_system.getCachedData("data/html/editor_template.html"));
				pSelf.openScreen(pSelf.editor_screen);
				pSelf.editor_screen.init();

				//Initialize tabs
				pSelf.tab_manager = new TabManager(document.getElementById("tab-bar")).create();
				pSelf.tab_manager.addTab("blank.json", {
					"minecraft:entity": {
						"format_version": "1.6.0",
						"component_groups": {},
						"components": {},
						"events": {}
					}
				});
			};
			this.loading_system.onChange = function(pProgress, pSelf) {
				document.body.querySelector("p").innerText = "Progress: " + pProgress;
			};
			//Load data
			this.loading_system.loadAll();
		}
	}

	/**
	 * Opens the screen handed over as a parameter
	 * @param {Screen} pScreen The screen to open
	 */
	openScreen(pScreen) {
		pScreen.initStyles();
		document.body.innerHTML = pScreen.getHtml();
	}

	openPopUp(pText) {
		let popup = new PopUpWindow("test", "90%", "90%", document.body, pText, true);
		popup.create();
	}

	loadFile(pFile, pIndex, pTotal) {
		let reader = new FileReader();
	
		//Opening loading window if first file
		if(pIndex == 0) {
			app.loading_window = new LoadingWindow().create();
			app.tab_manager.loaded_tabs = 0;
		}
		//Required vars
		reader.file_name = pFile.name;
		reader.total = pTotal;
	
		//Reading file
		reader.readAsText(pFile);
	
		reader.onload = function() {
			try {
				app.tab_manager.addTab(this.file_name, JSON.parse(JSON.minify(reader.result)), this.total);
			} catch(e) {
				console.warn("An error occurred while trying to open the file \"" + this.file_name + "\": ");
				console.log(e.message);
				new PushMessage(document.body, "Invalid JSON!").create();
			}
		}
	}

	download(pFileName, pText) {
		var element = document.createElement('a');
		element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pText));
		element.setAttribute('download', pFileName);
	  
		element.style.display = 'none';
		document.body.appendChild(element);
	  
		element.click();
		
		document.body.removeChild(element);
	}
}

//SCREENS
class Screen {
	/**
	 * Construct a new object of the type Screen
	 * @param {String} pHtml 
	 * @param {String} pStyle 
	 */
	constructor(pParent, pHtml, pStyle) {
		this.parent = pParent;
		this.html = pHtml;
		this.style = pStyle;
	}

	/**
	 * Initialize special styles for the screen
	 */
	initStyles() {
		document.body.classList.add("blue-background");
	}

	/**
	 * Get the HTML of this screen
	 * @returns HTML
	 */
	getHtml() {
		return this.html;
	}
	/**
	 * Get the style of this screen
	 * @returns CSS
	 */
	getStyle() {
		return this.style;
	}
}

class MobileScreen extends Screen {
	constructor(pParent) {
		super(pParent, "<div class='center blue-section'><h1 class='big'>:(</h1><br><br><h3>The JSON Editor cannot be used on mobile devices.</h3></div>");
	}
}

class EditorScreen extends Screen {
	constructor(pParent, pHTML) {
		super(pParent, pHTML);
	}
	/**
	 * Initialize special styles for the screen
	 */
	initStyles() {
		document.body.classList.remove("blue-background");
	}

	init() {
		this.ui_elements = {
			import_json: document.getElementById("import-json"),
			download_json: document.getElementById("download-json"),
			add_child_btn: document.getElementById("add-child"),
			add_value_btn: document.getElementById("add-value"),
			allow_edit_toggle: document.getElementById("allow-edit"),
			search_component_btn: document.getElementById("search-component"),
			auto_completions_toggle: document.getElementById("auto-completions-toggle")
		};

		this.ui_elements.import_json.onchange = function() {
			for(let i = 0; i < this.files.length; i++) {
				app.loadFile(this.files[i], i, this.files.length);
			}
		};
		this.ui_elements.download_json.onclick = function() {
			if(app.tab_manager.hasTabs()) {
				let tab = app.tab_manager.getSelectedTab();
				app.download(tab.getName(), JSON.stringify(tab.getObj(), null, "\t"));
			}
		};
		this.ui_elements.add_child_btn.onclick = function() {
			//addChild(document.getElementById("child-input").value);
			let key = document.getElementById("child-input").value;
			let editor = app.tab_manager.getSelectedTab().editor;
			editor.tree_manager.addObj(key, editor.path.getCurrentContext());

			/*if(auto_completions) {
				generateOptions("");
				if(data_list.options.length > 0) child_input.value = data_list.options[0].value;
				if((currentType != "object" && currentType != "array") || currentContext == "priority") {
					generateValueOptions("", true);
					if(value_list.options.length > 0) value_input.value = value_list.options[0].value;
					value_input.focus();
				} else {
					child_input.focus();
				}
			}*/
		};
		this.ui_elements.add_value_btn.onclick = function() {
			let value = document.getElementById("value-input").value;
			let editor = app.tab_manager.getSelectedTab().editor;
			editor.tree_manager.addValue(value, editor.path.getCurrentContext());

			/*if(auto_completions) {
				generateOptions("");
				if(data_list.options.length > 0) child_input.value = data_list.options[0].value;
			}
			value_input.value = "";
			child_input.focus();*/
		};
		this.ui_elements.allow_edit_toggle.onclick = function() {
			let loading_window = new LoadingWindow().create();
			toggleEdits();
			loading_window.destroy();
		};
		this.ui_elements.search_component_btn.onclick = function() {
			openDocumentation();
		};
		this.ui_elements.auto_completions_toggle.onclick = function() {
			auto_completions = !auto_completions;

			if(auto_completions) document.getElementById("auto-completions-toggle").classList.add("toggled");
			if(!auto_completions) document.getElementById("auto-completions-toggle").classList.remove("toggled");
		};
	}
}

class LoadingScreen extends Screen {
	constructor(pParent) {
		super(pParent, "<div class='center blue-section'><h1>Loading data</h1><div class='loading-outer center'><div class='loading-inner'></div></div><h5>We are preparing your<br> new JSON Experience!</h5><p></p></div>");
	}
}

//Windows
class ScreenElement {
	/**
	 * @param {Node} pParent The node parent of this element
	 * @param {String} pNodeType The node type to create
	 * @param {String} pNodeName The property name of the node (default: node)
	 */
	constructor(pParent, pNodeType, pNodeName="node") {
		this.parent = pParent;
		this.node_name = pNodeName;

		this[this.node_name] = document.createElement(pNodeType);
		this[this.node_name].js_element = this;
	}
	/**
	 * Adds the ScreenElement to the context where it is defined
	 */
	create() {
		this.parent.appendChild(this[this.node_name]);
		return this;
	}
	/**
	 * Removes the ScreenElement from the context where it is defined
	 */
	destroy() {
		this.parent.removeChild(this[this.node_name]);
		return this;
	}

	/**
	 * Shows ScreenElement
	 */
	show() {
		//PopUp needs to be first child
		this[this.node_name].style.display = "inline-block";
		return this;
	}
	/**
	 * Hides ScreenElement
	 */
	hide() {
		this[this.node_name].style.display = "none";
		return this;
	}
	/**
	 * Returns HTML of node
	 * @returns {String} HTML
	 */
	getHTML() {
		return this[this.node_name].outerHTML;
	}
	/**
	 * Returns node
	 * @returns {Node} node
	 */
	getNode() {
		return this[this.node_name];
	}
}

class PriorityScreenElement extends ScreenElement {
	constructor(pParent, pNodeType, pNodeName="node") {
		super(pParent, pNodeType, pNodeName);
	}
	/**
	 * Adds the popup window to the context where it is defined
	 */
	create() {
		//PriorityScreenElements need to be first child
		this.parent.insertBefore(this[this.node_name], this.parent.firstChild);
		return this;
	}
}

class PopUpWindow extends PriorityScreenElement {
	/**
	 * Create a new PopUpWindow
	 * @param {String} pId The unique ID of a popup window
	 * @param {Number} pW Width of window
	 * @param {Number} pH Height of window
	 * @param {Node} pParent The node parent of the popup window
	 * @param {String} pContent HTML Content for the popup window
	 * @param {Boolean} pHasCloseButton Whether the dialog shall have a close button
	 * @param {Boolean} pShowInnerBtn Whether the close button is inside the window
	 * @param {String} pOverflow Scrolling mode. Can be auto, scroll or hidden
	 */
	constructor(pId, pW, pH, pParent, pContent, pHasCloseButton=true, pShowInnerBtn=false, pOverflow="auto") {
		super(pParent, "DIV");

		//Outer DIV - blend background
		this.node.id = "popup-" + pId;
		this.node.classList.add("blend-full-screen");
		//Inner DIV - actual frame
		this.inner_div = document.createElement("DIV");
		this.inner_div.classList.add("section", "popup-inner-frame");
		this.inner_div.innerHTML = pContent;
		this.inner_div.style.overflowY = pOverflow;
		this.inner_div.style.width = pW;
		this.inner_div.style.setProperty("--window-height", pH);

		//Close Button
		if(pHasCloseButton) {
			this.btn = new CloseButton(this.node).getNode();

			//Building window
			if(pShowInnerBtn) {
				this.btn.classList.add("inner")
				this.inner_div.appendChild(this.btn);
			} else {
				this.node.insertBefore(this.btn, this.node.firstChild);
			}
		}

		this.node.appendChild(this.inner_div);
	}
}

class LoadingWindow extends PopUpWindow {
	constructor() {
		let loading_animation = "<div class='loading-outer center'><div class='loading-inner'></div></div>";
		super("loading", "40%", "102px", document.body, loading_animation, false, false, "hidden");
	}
}

class PushMessage extends PriorityScreenElement {
	/**
	 * @param {Node} pParent The parent node (context of the push message)
	 * @param {String} pContent The text to show in the push message
	 */
	constructor(pParent, pContent) {
		super(pParent, "DIV");

		//Outer DIV - blend background
		this.node.classList.add("push-message");
		//Inner DIV - actual frame
		this.inner_div = document.createElement("DIV");
		this.inner_div.classList.add("push-message-frame");
		this.inner_div.innerHTML = pContent;
		//Close Button
		this.btn = new CloseButton(this.node).getNode();
		this.btn.classList.add("btn-xs");
		//Building window
		this.btn.classList.add("inner")
		this.inner_div.appendChild(this.btn);
		
		this.node.appendChild(this.inner_div);
	}
}


//Buttons
class ActionButton extends ScreenElement {
	/**
	 * 
	 * @param {Node} pParent The button's parent HTML element
	 * @param {String} pText Text to show on the button (can be HTML)
	 * @param {Function} pAction Function to call onclick
	 */
	constructor(pParent, pText="undefined") {
		super(pParent, "BUTTON", "btn");
		this.btn.parent = pParent;
		this.parent = pParent;

		this.btn.classList.add("btn", "btn-outline-primary", "inline-element");
		this.btn.innerHTML = pText;
		this.btn.onclick = this.onclick;
	}

	onclick() {
		console.log("Button clicked!");
	}
}

class CloseButton extends ActionButton {
	/**
	 * @param {Node} pParent The button's parent HTML element
	 * @param {String} pText Text to show on the button (can be HTML)
	 */
	constructor(pParent, pText="<i class='fa fa-remove'></i>") {
		super(pParent, pText);

		this.btn.classList.add("close-popup-window");
	}

	onclick() {
		this.parent.js_element.destroy();
	}
}