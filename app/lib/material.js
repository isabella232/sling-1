// Copyright 2020 Ringgaard Research ApS
// Licensed under the Apache License, Version 2

// Material Design web components.

import {Component, stylesheet} from "./component.js";

//-----------------------------------------------------------------------------
// Global styles
//-----------------------------------------------------------------------------

stylesheet(`
@import url(https://fonts.googleapis.com/css?family=Roboto:400,400italic,500,500italic,700,700italic,900,900italic,300italic,300,100italic,100);

@font-face {
  font-family: 'Material Icons';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/materialicons/v102/flUhRq6tzZclQEJ-Vdg-IuiaDsNc.woff2) format('woff2');
}

@font-face {
  font-family: 'Material Icons Outlined';
  font-style: normal;
  font-weight: 400;
  src: url(https://fonts.gstatic.com/s/materialiconsoutlined/v79/gok-H7zzDkdnRel8-DQ6KAXJ69wP1tGnf4ZGhUce.woff2) format('woff2');
}

html {
  width: 100%;
  height: 100%;
  min-height: 100%;
  position:relative;
}

body {
  font-family: Roboto,Helvetica,sans-serif;
  font-size: 14px;
  font-weight: 400;
  padding: 0;
  margin: 0;
  box-sizing: border-box;

  width: 100%;
  height: 100%;
  min-height: 100%;
  position: relative;
}
`);

//-----------------------------------------------------------------------------
// Layout
//-----------------------------------------------------------------------------

export class MdColumnLayout extends Component {
  static stylesheet() {
    return `
      $ {
        display: flex;
        flex-direction: column;
        margin: 0;
        height: 100%;
        min-height: 100%;
      }
    `;
  }
}

Component.register(MdColumnLayout);

export class MdRowLayout extends Component {
  static stylesheet() {
    return `
      $ {
        display: flex;
        flex-direction: row;
        margin: 0;
        width: 100%;
        min-width: 100%;
      }
    `;
  }
}

Component.register(MdRowLayout);

export class MdContent extends Component {
  static stylesheet() {
    return `
      $ {
        flex: 1;
        padding: 8px;
        display: block;
        overflow: auto;
        color: rgb(0,0,0);
        background-color: #eeeeee;

        position: relative;

        flex-basis: 0%;
        flex-grow: 1;
        flex-shrink: 1;
      }
    `;
  }
}

Component.register(MdContent);

export class MdSpacer extends Component {
  static stylesheet() {
    return `
      $ {
        display: block;
        flex: 1;
      }
    `;
  }
}

Component.register(MdSpacer);

//-----------------------------------------------------------------------------
// Modal
//-----------------------------------------------------------------------------

export class MdModal extends Component {
  open(state) {
    document.body.appendChild(this);
    this.tabIndex = -1;
    this.focus();
    if (this.onopen) this.onopen();
    this.update(state);
  }

  close(e) {
    if (this.onclose) this.onclose(e);
    document.body.removeChild(this);
  }

  static stylesheet() {
    return `
      $ {
        display: block;
        position: fixed;
        z-index: 100;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      }
    `;
  }
}

Component.register(MdModal);

//-----------------------------------------------------------------------------
// Dialog
//-----------------------------------------------------------------------------

export class MdDialog extends Component {
  show() {
    // Add dialog to DOM.
    document.body.insertAdjacentHTML("beforeend", "<dialog></dialog>");
    this.dialog = document.body.lastChild;
    this.dialog.addEventListener("close", e => this.cancel());
    this.dialog.appendChild(this);

    // Open dialog.
    if (this.onopen) this.onopen();
    this.dialog.showModal();

    // Bind default submit and cancel.
    this.bind(null, "keydown", e => {
      if (e.keyCode == 13) {
        this.submit();
        e.preventDefault();
      }
      if (e.keyCode == 27) {
        this.cancel();
        e.preventDefault();
      }
    });
    if (this.find("#submit")) {
      this.bind("#submit", "click", e => this.submit());
    }
    if (this.find("#cancel")) {
      this.bind("#cancel", "click", e => this.cancel());
    }

    let promise = new Promise((resolve, reject) => { this.resolve = resolve; });
    return promise;
  }

  close(result) {
    document.body.removeChild(this.dialog);
    this.resolve(result);
  }

  submit() {
    this.close(true);
  }

  cancel() {
    this.close(false);
  }

  static stylesheet() {
    return `
      dialog {
        border-style: none;
        padding: 0px;
        border-radius: 5px;
        box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
      }

      $ {
        display: block;
        padding-left: 16px;
        padding-right: 16px;
      }
    `;
  }
}

Component.register(MdDialog);

export class MdDialogTop extends Component {
  static stylesheet() {
    return `
      $ {
        display: flex;
        align-items: center;
        margin-top: 16px;
        margin-bottom: 16px;
        font-size: 1.25rem;
        line-height: 2rem;
        font-weight: 500;
        letter-spacing: .0125em;
      }
    `;
  }
}

Component.register(MdDialogTop);

export class MdDialogBottom extends Component {
  static stylesheet() {
    return `
      $ {
        display: flex;
        justify-content: flex-end;
        flex-shrink: 0;
        flex-wrap: wrap;
        padding-top: 8px;
        padding-bottom: 8px;
      }
      $[center] {
        justify-content: center;
      }
      $ button {
        font: bold 14px Roboto,Helvetica,sans-serif;
        color: #00A0D6;
        background-color: #ffffff;
        border: none;
        border-radius: 4px;
        text-transform: uppercase;
        letter-spacing: 1.25px;
        text-align: right;
        padding: 8px;
        margin-left: 4px;
        cursor: pointer;
      }
      $ button:hover {
        background-color: #eeeeee;
      }
      $ button:active {
        background-color: #aaaaaa;
      }
    `;
  }
}

Component.register(MdDialogBottom);

export class StdDialog extends MdDialog {
  onconnected() {
    this.action = {};
    if (this.state && this.state.buttons) {
      for (let button of Object.keys(this.state.buttons)) {
        let id = button.replace(/ /g, "-").toLowerCase();
        this.action[id] = this.state.buttons[button];
        this.bind("#" + id, "click", e => this.onclick(e));
      }
    }
  }

  onclick(e) {
    if (e.target.id != "cancel" && e.target.id != "submit") {
      this.close(this.action[e.target.id]);
    }
  }

  render() {
    let s = this.state;
    if (!s) return;
    let h = [];
    if (s.title) {
      h.push("<md-dialog-top>");
      if (s.icon) h.push(`<md-icon icon="${s.icon}"></md-icon>`);
      h.push(Component.escape(s.title));
      h.push("</md-dialog-top>");
    }
    if (s.message) {
      h.push("<div>");
      h.push(Component.escape(s.message));
      h.push("</div>");
    }
    if (s.buttons) {
      h.push("<md-dialog-bottom center>");
      for (let button of Object.keys(s.buttons)) {
        let id = button.replace(/ /g, "-").toLowerCase();
        h.push(`<button id="${id}">${button}</button>`);
      }
      h.push("</md-dialog-bottom>");
    }
    return h.join("");
  }

  static choose(title, message, buttons, icon) {
    let dialog = new StdDialog({title, message, buttons, icon});
    return dialog.show();
  }

  static alert(title, message) {
    let buttons = {"OK": true};
    return StdDialog.choose(title, message, buttons, "warning");
  }

  static error(message) {
    let buttons = {"OK": true};
    return StdDialog.choose("Error", message, buttons, "error");
  }

  static ask(title, message, yes = "Yes", no = "No") {
    let buttons = {[no]: false, [yes]: true};
    return StdDialog.choose(title, message, buttons);
  }

  static confirm(title, message, ok = "OK", cancel = "Cancel") {
    let buttons = {[cancel]: false, [ok]: true};
    return StdDialog.choose(title, message, buttons);
  }

  static stylesheet() {
    return MdDialog.stylesheet() + `
      $ {
        font-size: 16px;
        min-width: 200px;
      }
      $ md-icon {
         font-size: 32px;
         margin-right: 6px;
      }
    `;
  }
}

Component.register(StdDialog);

//-----------------------------------------------------------------------------
// Toolbar
//-----------------------------------------------------------------------------

export class MdToolbar extends Component {
  static stylesheet() {
    return `
      $ {
        display: flex;
        flex-direction: row;
        align-items: center;
        background-color: #00A0D6;
        color: rgb(255,255,255);
        height: 56px;
        max-height: 56px;
        font-size: 20px;
        padding: 0px 16px;
        margin: 0;
        box-shadow: 0 1px 8px 0 rgba(0,0,0,.2),
                    0 3px 4px 0 rgba(0,0,0,.14),
                    0 3px 3px -2px rgba(0,0,0,.12);
        z-index: 2;
      }
    `;
  }
}

Component.register(MdToolbar);

//-----------------------------------------------------------------------------
// Menu
//-----------------------------------------------------------------------------

var current_menu;

window.onclick = e => {
  // Close menu on click outside menu.
  if (current_menu && event.target != current_menu) current_menu.close();
}

export class MdMenu extends Component {
  onconnected() {
    this.bind("#open", "click", e => this.onmenu(e));
  }

  open() {
    let content = this.find(".menu-content");
    content.style.display = "block";
    content.focus();
    current_menu = this;
  }

  close() {
    let content = this.find(".menu-content");
    content.style.display = "none";
    current_menu = null;
  }

  onmenu(e) {
    if (current_menu && current_menu != this) current_menu.close();
    let content = this.find(".menu-content");
    if (content.style.display == "block") {
      this.close();
    } else {
      this.open();
    }
    e.stopPropagation();
  }

  render() {
    let h = [];
    h.push('<md-icon-button id="open" icon="more_vert"></md-icon-button>');
    let content = document.createElement("div");
    content.className = "menu-content";
    for (let item of this.elements) {
      content.appendChild(item);
    }
    h.push(content);

    return h;
  }

  static stylesheet() {
    return `
      $ {
        display: inline-block;
        position: relative;
      }

      $ .menu-content {
        display: none;
        position: absolute;
        padding: 8px 0px 8px 0px;
        font-size: 15px;
        background-color: #f9f9f9;
        box-shadow: 0 14px 28px rgba(0,0,0,0.25), 0 10px 10px rgba(0,0,0,0.22);
        z-index: 1;
        right: 0;
      }
    `;
  }
}

Component.register(MdMenu);

export class MdMenuItem extends Component {
  onconnected() {
    this.bind(null, "click", e => this.onclick(e));
  }

  onclick(e) {
    this.match("md-menu").close();
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent("select"));
  }

  static stylesheet() {
    return `
      $ {
        display: flex;
        align-items: center;
        padding: 8px 24px 8px 24px;
      }
      $:hover {
        background-color: #f1f1f1;
      }
      $ md-icon {
        width: 40px;
      }
    `;
  }
}

Component.register(MdMenuItem);

//-----------------------------------------------------------------------------
// Menu drawer
//-----------------------------------------------------------------------------

export class MdDrawer extends Component {
  visible() {
    return this.state;
  }

  toogle() {
    this.update(!this.state);
  }

  static stylesheet() {
    return `
      $ {
        max-width: 30%;
        height: 100%;
        display: block;
        overflow: auto;
      }
    `;
  }
}

Component.register(MdDrawer);

//-----------------------------------------------------------------------------
// Tabs
//-----------------------------------------------------------------------------

export class MdTabs extends Component {
  constructor() {
    super();
    this.selected = this.find(this.getAttribute("selected"));
  }

  onconnected() {
    this.bind(null, "click", e => this.onclick(e));
    if (this.selected) this.select(this.selected);
  }

  onclick(e) {
    if (e.target != this) this.select(e.target);
  }

  select(tab) {
    if (!tab) return;
    if (this.selected) this.selected.classList.remove("selected");
    this.selected = tab;
    this.selected.classList.add("selected");
  }

  static stylesheet() {
    return `
      $ {
        height: 100%;
        margin: 5px;
        display: table;
        flex-direction: row;
        align-items: center;
        border-spacing: 3px;
      }

      $ .selected {
        border-bottom: 2px solid;
      }
    `;
  }
}

Component.register(MdTabs);

export class MdTab extends Component {
  static stylesheet() {
    return `
      $ {
        height: 100%;
        text-transform: uppercase;
        padding: 5px;
        text-align: center;
        display: table-cell;
        vertical-align: middle;
        font-size: 16px;
        cursor: pointer;
      }

      $:hover {
        background-color: rgba(0,0,0,0.07);
      }
    `;
  }
}

Component.register(MdTab);

//-----------------------------------------------------------------------------
// Card
//-----------------------------------------------------------------------------

export class MdCard extends Component {
  static stylesheet() {
    return `
      $ {
        display: block;
        background-color: rgb(255, 255, 255);
        box-shadow: rgba(0, 0, 0, 0.16) 0px 2px 4px 0px,
                    rgba(0, 0, 0, 0.23) 0px 2px 4px 0px;
        padding: 10px;
        margin: 5px;
      }
    `;
  }
}

Component.register(MdCard);

export class MdCardToolbar extends Component {
  static stylesheet() {
    return `
      $ {
        display: flex;
        flex-direction: row;
        align-items: top;
        background-color: #FFFFFF;
        color: #000000;
        font-size: 24px;
        margin-bottom: 10px;
      }
    `;
  }
}

Component.register(MdCardToolbar);

//-----------------------------------------------------------------------------
// Logo
//-----------------------------------------------------------------------------

const logo = "\
M257.94,57.87c-16,22.9-37.86,45.41-62.54,60a60.83,60.83,0,0,0,7.66-29.64,61.\
23,61.23,0,0,0-61.25-61.06h0c-49.88,0-96.7,40.07-126,80.91-2.86-3.22-5.58-6.\
53-8.19-9.86S2.44,91.58,0,88.27C32.81,43.72,86,0,141.73,0,184.65,0,226.22,25\
.65,257.94,57.87Zm18,20.32c-2.62-3.33-5.33-6.64-8.19-9.86-29.33,40.84-76.16,\
80.91-126,80.91h0a61,61,0,0,1-53.59-90.7c-24.68,14.63-46.59,37.15-62.55,60,3\
1.73,32.22,73.3,57.89,116.21,57.88,55.79,0,108.93-43.73,141.73-88.28C281,84.\
88,278.52,81.53,275.91,78.19Zm-134.48-37a46.87,46.87,0,1,0,46.88,46.87A46.87\
,46.87,0,0,0,141.43,41.18Z";

export class MdLogo extends Component {
  render() {
    return `
      <a href="/" tabindex="-1">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 283.46 176.46">
          <g><path d="${logo}"/></g>
        </svg>
      </a>`;
  }

  static stylesheet() {
    return `
      $ svg {
        width: 100%;
      }
      $ path {
        fill: #00A0D6; }
      }
    `;
  }
}

Component.register(MdLogo);

export class MdToolbarLogo extends MdLogo {
  static stylesheet() {
    return `
      $ {
        margin: 5px 10px 0px 0px;
        outline: none;
      }
      $ svg {
        width: 50px;
      }
      $ path {
        fill: #FFFFFF; }
      }
    `;
  }
}

Component.register(MdToolbarLogo);

//-----------------------------------------------------------------------------
// Button
//-----------------------------------------------------------------------------

export class MdIconButton extends Component {
  constructor() {
    super();
    this.state = true;
  }

  visible() {
    return this.state;
  }

  render() {
    let attrs = [];
    if (this.props.disabled) attrs.push('disabled');
    if (this.props.shortcut) attrs.push(`accesskey="${this.props.shortcut}"`);
    if (this.props.type) attrs.push(`type="${this.props.type}"`);
    let iattrs = [];
    iattrs.push(`icon="${this.props.icon}"`);
    if (this.props.outlined != undefined) iattrs.push(`class="outlined"`);
    return `
      <button ${attrs.join(" ")}>
        <md-icon ${iattrs.join(" ")}></md-icon>
      </button>`;
  }

  disable() {
    if (!this.props.disabled) {
      this.props.disabled = true;
      this.update(this.state);
    }
  }

  enable() {
    if (this.props.disabled) {
      this.props.disabled = false;
      this.update(this.state);
    }
  }

  static stylesheet() {
    return `
      $ button {
        border-radius: 50%;
        border: 0;
        height: 40px;
        width: 40px;
        background: transparent;
        user-select: none;
        cursor: pointer;
        color: inherit;
        font-size: inherit;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      $ button:hover:enabled {
        background-color: rgba(0,0,0,0.07);
      }

      md-icon-button button:disabled {
        color: rgba(0,0,0,0.38);
        cursor: default;
      }

      md-toolbar $ button {
        color: rgb(255,255,255);
      }

      $ button:focus {
        outline: none;
      }
    `;
  }
}

Component.register(MdIconButton);

//-----------------------------------------------------------------------------
// Text
//-----------------------------------------------------------------------------

export class MdText extends Component {
  visible() {
    return this.state;
  }

  render() {
    let text = this.state;
    if (text) {
      return `${Component.escape(text)}`;
    } else {
      return "";
    }
  }
}

Component.register(MdText);

export class MdLink extends Component {
  render() {
    if (!this.state) return "";
    let url = this.state.url;
    let text = this.state.text;
    let attrs = [];
    if (this.props.newtab || this.state.newtab) {
      attrs.push('target="_blank"');
    }
    if (this.props.external || this.state.external) {
      attrs.push('rel="noreferrer"');
    }
    if (this.props.notab || this.state.notab) {
      attrs.push('tabindex="-1"');
    }
    if (url == null) {
      return `<a>${Component.escape(text)}</a>`;
    } else if (text) {
      let extra = attrs.join(" ");
      return `<a href="${url}" ${extra}>${Component.escape(text)}</a>`;
    } else {
      return "";
    }
  }
}

Component.register(MdLink);

//-----------------------------------------------------------------------------
// Image
//-----------------------------------------------------------------------------

export class MdImage extends Component {
  visible() {
    return this.state;
  }

  render() {
    return `<img src="${this.state}" rel="noreferrer">`;
  }
}

Component.register(MdImage);

//-----------------------------------------------------------------------------
// Icon
//-----------------------------------------------------------------------------

var custom_icons = {};

export class MdIcon extends Component {
  constructor() {
    super();
    this.state = true;
  }

  onconnected() {
    if (this.props.outlined != undefined) this.className = "outlined";
  }

  visible() {
    return this.state;
  }

  render() {
    let icon = custom_icons[this.props.icon]
    return icon ? icon : this.props.icon;
  }

  static custom(name, code) {
    custom_icons[name] = code;
  }

  static stylesheet() {
    return `
      $ {
        font-family: 'Material Icons';
        font-weight: normal;
        font-style: normal;
        font-size: 24px;
        line-height: 1;
        letter-spacing: normal;
        text-transform: none;
        display: inline-block;
        white-space: nowrap;
        word-wrap: normal;
        direction: ltr;
        -webkit-font-feature-settings: 'liga';
        -webkit-font-smoothing: antialiased;
      }
      $.outlined {
        font-family: 'Material Icons Outlined';
      }
    `;
  }
}

Component.register(MdIcon);

//-----------------------------------------------------------------------------
// Radio button
//-----------------------------------------------------------------------------

export class MdRadioButton extends Component {
  render() {
    return `
      <input type="radio"
             name="${this.props.name}"
             value="${this.props.value}"
             ${this.props.selected ? "checked" : ""}>`;
  }

  static stylesheet() {
    return `
      $ {
        display: flex;
        height: 30px;
        width: 30px;
        border-radius: 50%;
      }

      $:hover {
        background-color: rgba(0,0,0,0.07);
      }

      $ input {
        height: 15px;
        width: 15px;
        margin: 8px;
        background: transparent;
        user-select: none;
        cursor: pointer;
      }
    `;
  }
}

Component.register(MdRadioButton);

//-----------------------------------------------------------------------------
// Checkbox
//-----------------------------------------------------------------------------

export class MdCheckbox extends Component {
  onconnect() {
    if (this.state == undefined || this.state == null) {
      this.state = this.props["checked"];
    }
  }

  onconnected() {
    this.bind(null, "change", e => this.onchange(e));
  }

  onchange(e) {
    this.state = this.find("input").checked;
  }

  get checked() {
    return this.state;
  }

  set checked(value) {
    if (value == "false" || value == 0) value = false;
    if (value == "true" || value == 1) value = true;
    this.update(value);
  }

  render() {
    let label = this.props.label ? Component.escape(this.props.label) : "";
    return `
      <label>
        <input type="checkbox" ${this.state ? "checked" : ""}>
        <div>${label}</div>
      </label>
    `;
  }

  static stylesheet() {
    return `
      $ label {
        display: flex;
      }
      $ input {
        transform: scale(1.5)
      }
      $ div {
        font-size: 16px;
        margin-left: 3px;
        margin-top: -1px;
      }
    `;
  }
}

Component.register(MdCheckbox);

//-----------------------------------------------------------------------------
// Text field
//-----------------------------------------------------------------------------

class MdTextField extends Component {
  onconnect() {
    if (!this.state) this.state = this.props["value"];
  }

  get value() {
    return this.state;
  }
  set value(v) {
    this.update(v);
  }


  onconnected() {
    this.bind(null, "focusin", e => this.onfocus(e));
    this.bind(null, "focusout", e => this.onunfocus(e));
    this.bind(null, "input", e => this.onchange(e));
  }

  onfocus(e) {
    this.find("div").className = "focused";
  }

  onunfocus(e) {
    this.find("div").className = this.state ? "above" : "";
  }

  onchange(e) {
    this.state = e.target.value
  }

  render() {
    let value = this.state ? Component.escape(this.state) : "";
    let label = this.props.label ? Component.escape(this.props.label) : "";

    return `
      <label>
        <div class="${value ? "above" : ""}">${label}</div>
        <input value="${value}">
      </label>
    `;
  }

  static stylesheet() {
    return `
      $ {
        display: flex;
      }
      $ label {
        display: block;
        width: 100%
      }
      $ div {
        position: absolute;
        padding-left: 16px;
        padding-top: 13px;
        font-size: 16px;
        color: #757575;
        text-overflow: ellipsis;
      }
      $ .above {
        padding-top: 6px;
        font-size: 12px;
        color: #5f5f5f;
      }
      $ .focused {
        padding-top: 6px;
        font-size: 12px;
        color: #00A0D6;
      }
      $ input {
        display: block;
        border-top: none;
        border-left: none;
        border-right: none;
        border-bottom: 1px solid #6b6b6b;
        border-radius: 4px 4px 0 0;
        padding: 20px 16px 6px 16px;
        background-color: #f5f5f5;
        font-size: 16px;
        font-family: inherit;
        width: calc(100% - 32px);
      }
      $ input:hover {
        background-color: #eeeeee;
        border-bottom: 1px solid #000000;
      }
      $ input:focus {
        background-color: #dcdcdc;
        border-bottom-color: ;
        border-bottom: 2px solid #00A0D6;
        padding-bottom: 5px;
        outline: none;
      }
    `;
  }
}

Component.register(MdTextField);

export class MdInput extends Component {
  value() {
    return this.find("input").value;
  }

  onupdated() {
    let value = this.state;
    if (value) this.find("input").value = value;
  }

  render() {
    let attrs = [];
    if (this.props.type) {
      attrs.push(` type="${this.props.type}"`);
    }
    if (this.props.placeholder) {
      attrs.push(` placeholder="${this.props.placeholder}"`);
    }
    attrs.push(' spellcheck="false"');
    if (this.props.autofocus != undefined) {
      attrs.push(' autofocus');
    }

    return `<input ${attrs.join("")}>`;
  }

  static stylesheet() {
    return `
      $ {
        display: block;
        position: relative;
        width: 100%;

        color: black;
        font-family: Roboto,Helvetica,sans-serif;
        font-size: 14px;
      }

      $ input {
        outline: none;
        border: none;
        line-height: 40px;
        height: 40px;
        width: 100%;
        padding: 10px;
        border-radius: 5px;
      }
    `;
  }
}

Component.register(MdInput);

//-----------------------------------------------------------------------------
// Toolbox
//-----------------------------------------------------------------------------

export class MdToolbox extends Component {
  visible() {
    return this.state;
  }

  onconnected() {
    let parent = this.parentElement;
    parent.addEventListener("mouseenter", e => this.onenter(e));
    parent.addEventListener("mouseleave", e => this.onleave(e));
  }

  onenter(e) {
    if (!this.state) this.update(true);
  }

  onleave(e) {
    if (this.state) this.update(false);
  }

  static stylesheet() {
    return `
      $ {
        display: flex;
        flex-direction: row;
      }
    `;
  }
}

Component.register(MdToolbox);

//-----------------------------------------------------------------------------
// Search box
//-----------------------------------------------------------------------------

export class MdSearch extends Component {
  onconnected() {
    this.bind("input", "input", e => this.oninput(e));
    this.bind("input", "keydown", e => this.onkeydown(e));
    this.bind(null, "focusin", e => this.onfocus(e));
    this.bind(null, "focusout", e => this.onunfocus(e));
  }

  onkeydown(e) {
    let list = this.find("md-search-list");
    if (list) {
      if (e.keyCode == 40) {
        list.next();
      } else if (e.keyCode == 38) {
        list.prev();
      } else if (e.keyCode == 13) {
        e.preventDefault();
        if (this.props.autoselect && !list.active) list.next();
        if (list.active) {
          this.select(list.active, e.ctrlKey);
        } else {
          list.expand(false);
          this.dispatchEvent(new CustomEvent("enter", {detail: this.query()}));
        }
      }
    }
  }

  oninput(e) {
    let query = e.target.value;
    let min_length = this.props.min_length;
    if (min_length && query.length < min_length) {
      this.populate(null, null);
    } else {
      this.find("input").style.cursor = "wait";
      this.dispatchEvent(new CustomEvent("query", {detail: query}));
    }
  }

  onfocus(e) {
    this.find("md-search-list").expand(true);
  }

  onunfocus(e) {
    this.find("md-search-list").expand(false);
  }

  populate(query, items) {
    // Ignore stale updates where the query does match the current value of the
    // search input box.
    if (query != null && query != this.query()) return;
    let list = this.find("md-search-list");
    list.update({items: items});
    list.scrollTop = 0;
    this.find("input").style.cursor = "";
  }

  select(item, keep) {
    let list = this.find("md-search-list");
    if (!keep) list.expand(false);
    if (item != null) {
      this.find("input").blur();
      this.dispatchEvent(new CustomEvent("item", {detail: item.state}));
    }
  }

  query() {
    return this.find("input").value;
  }

  clear() {
    let input = this.find("input");
    input.value = null;
    this.populate(null, null);
    input.focus();
  }

  render() {
    let attrs = [];
    if (this.props.placeholder) {
      attrs.push(` placeholder="${this.props.placeholder}"`);
    }
    attrs.push(' spellcheck="false"');
    if (this.props.autofocus != undefined) {
      attrs.push(' autofocus');
    }

    return `
        <input type="search" ${attrs.join("")}>
        <md-search-list></md-search-list>
    `;
  }

  static stylesheet() {
    return `
      $ {
        display: block;
        position: relative;
        width: 100%;

        color: black;
        font-family: Roboto,Helvetica,sans-serif;
        font-size: 15px;
      }

      $ input {
        outline: none;
        border: none;
        width: 100%;
        padding: 10px;
        border-radius: 5px;
        font-size: 15px;
      }
    `;
  }
}

Component.register(MdSearch);

export class MdSearchList extends Component {
  constructor() {
    super();
    this.bind(null, "mousedown", this.onmousedown);
    this.active = null;
  }

  onmousedown(e) {
    // Prevent search list from receiving focus on click.
    e.preventDefault();
  }

  expand(expanded) {
    if (!this.state || !this.state.items || this.state.items.length == 0) {
      expanded = false;
    }
    this.style.display = expanded ? "block" : "none";
  }

  next() {
    if (this.active) {
      if (this.active.nextSibling) {
        this.activate(this.active.nextSibling);
      }
    } else if (this.firstChild) {
      this.activate(this.firstChild);
    }
  }

  prev() {
    if (this.active) {
      this.activate(this.active.previousSibling);
    }
  }

  activate(item) {
    if (this.active) {
      this.active.highlight(false);
    }

    if (item) {
      item.highlight(true);
      item.scrollIntoView({block: "nearest"});
    }
    this.active = item;
  }

  onupdated() {
    this.active = null;
  }

  render() {
    if (!this.state || !this.state.items || this.state.items.length == 0) {
      this.expand(false);
      return "";
    } else {
      this.expand(true);
      return this.state.items;
    }
  }

  static stylesheet() {
    return `
      $ {
        display: none;
        position: absolute;
        background: #ffffff;
        box-shadow: rgba(0, 0, 0, 0.16) 0px 2px 4px 0px,
                    rgba(0, 0, 0, 0.23) 0px 2px 4px 0px;
        z-index: 99;
        width: 100%;
        max-height: 400px;
        overflow: auto;
        cursor: pointer;
      }
    `;
  }
}

Component.register(MdSearchList);

export class MdSearchItem extends Component {
  onconnected() {
    this.bind(null, "mousemove", this.onmousemove);
    this.bind(null, "click", e => this.onclick(e));
  }

  onclick(e) {
    this.match("md-search").select(this, e.ctrlKey);
  }

  onmousemove(e) {
    this.match("md-search-list").activate(this);
  }

  highlight(on) {
    this.style.background = on ? "#f0f0f0" : "#ffffff";
  }

  static stylesheet() {
    return `
      $ {
        display: block;
        border-top: 1px solid #d4d4d4;
        paddding-bottom: 1px;
      }
    `;
  }
}

Component.register(MdSearchItem);

export class MdSearchResult extends MdSearchItem {
  render() {
    let h = [];
    if (this.state.name) {
      h.push('<span class="item-title">');
      h.push(Component.escape(this.state.name));
      h.push('</span>');
    }
    if (this.state.description) {
      h.push('<span class="item-description">');
      h.push(Component.escape(this.state.description));
      h.push('</span>');
    }
    return h.join("");
  }

  static stylesheet() {
    return MdSearchItem.stylesheet() + `
      $ .item-title {
        font-weight: bold;
        display: block;
        padding: 2px 10px 2px 10px;
      }

      $ .item-description {
        display: block;
        padding: 0px 10px 0px 10px;
      }
    `;
  }
}

Component.register(MdSearchResult);

//-----------------------------------------------------------------------------
// Data table
//-----------------------------------------------------------------------------

export class MdDataField extends Component {}

Component.register(MdDataField);

export class MdDataTable extends Component {
  constructor() {
    super();
    this.fields = [];
    for (const e of this.elements) {
      this.fields.push({
        name: e.getAttribute("field"),
        header: e.innerHTML,
        style: e.style ? e.style.cssText : null,
        cls: e.className ? e.className : null,
        escape: !e.getAttribute("html"),
      });
    }
  }

  render() {
    let h = [];
    h.push("<table><thead><tr>");
    for (const fld of this.fields) {
      if (fld.style) {
        h.push(`<th style="${fld.style}">`);
      } else {
        h.push("<th>");
      }
      h.push(fld.header);
      h.push("</th>");
    }
    h.push("</tr></thead><tbody>");

    if (this.state) {
      for (const row of this.state) {
        if (row.style) {
          h.push(`<tr style="${row.style}">`);
        } else {
          h.push("<tr>");
        }
        for (const fld of this.fields) {
          if (fld.cls) {
            h.push(`<td class="${fld.cls}">`);
          } else if (fld.style) {
            h.push(`<td style="${fld.style}">`);
          } else {
            h.push("<td>");
          }

          let value = row[fld.name];
          if (value == undefined) value = "";
          value = value.toString();

          if (fld.escape) value = Component.escape(value);
          h.push(value);
          h.push("</td>");
        }
        h.push("</tr>");
      }
    }

    h.push("</tbody></table>");

    return h.join("");
  }

  static stylesheet() {
    return `
      $ {
        border: 0;
        white-space: nowrap;
        font-size: 14px;
        text-align: left;
      }

      $ thead {
        padding-bottom: 3px;
      }

      $ th {
        vertical-align: bottom;
        padding: 8px 12px;
        box-sizing: border-box;
        border-bottom: 1px solid rgba(0,0,0,.12);
        text-overflow: ellipsis;
        color: rgba(0,0,0,.54);
      }

      $ td {
        vertical-align: middle;
        border-bottom: 1px solid rgba(0,0,0,.12);
        padding: 8px 12px;
        box-sizing: border-box;
        text-overflow: ellipsis;
        overflow: hidden;
      }

      $ td:first-of-type, $ th:first-of-type {
        padding-left: 24px;
      }
    `;
  }
}

Component.register(MdDataTable);

