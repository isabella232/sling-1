// Copyright 2020 Ringgaard Research ApS
// Licensed under the Apache License, Version 2

import {Component} from "/common/lib/component.js";
import * as material from "/common/lib/material.js";
import {Frame, QString} from "/common/lib/frame.js";
import {store, settings} from "./global.js";

const n_id = store.id;
const n_is = store.is;
const n_name = store.lookup("name");
const n_caseno = store.lookup("caseno");
const n_main = store.lookup("main");
const n_topics = store.lookup("topics");
const n_folders = store.lookup("folders");
const n_next = store.lookup("next");
const n_sling_case_no = store.lookup("PCASE");

class LabelCollector {
  constructor(store) {
    this.store = store;
    this.items = new Set();
  }

  add(item) {
    // Add all missing values to collector.
    for (let [name, value] of item) {
      if (value instanceof Frame) {
        if (value.isanonymous()) {
          this.add(value);
        } else if (value.isproxy()) {
          this.items.add(value);
        }
      } else if (value instanceof QString) {
        if (value.qual) this.items.add(value.qual);
      }
    }
  }

  async retrieve() {
    // Skip if all labels has already been resolved.
    if (this.items.size == 0) return null;

    // Retrieve stubs from knowledge service.
    let response = await fetch(settings.kbservice + "/kb/stubs", {
      method: 'POST',
      headers: {
        'Content-Type': 'application/sling',
      },
      body: this.store.encode(Array.from(this.items)),
    });
    let stubs = await this.store.parse(response);

    // Mark as stubs.
    for (let stub of stubs) {
      if (stub) stub.markstub();
    }

    return stubs;
  }
};

//-----------------------------------------------------------------------------
// Case Editor
//-----------------------------------------------------------------------------

class CaseEditor extends Component {
  onconnected() {
    this.app = this.match("#app");
    this.bind("#menu", "click", e => this.onmenu(e));
    this.bind("#home", "click", e => this.close());
    this.bind("#save", "click", e => this.onsave(e));
    this.bind("#newfolder", "click", e => this.onnewfolder(e));

    document.addEventListener("keydown", e => this.onkeydown(e));
    window.addEventListener("beforeunload", e => this.onbeforeunload(e));
  }

  onbeforeunload(e) {
    // Notify about unsaved changes.
    if (this.dirty) {
      e.preventDefault();
      e.returnValue = "";
    }
  }

  onkeydown(e) {
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      this.onsave(e);
    } else if (e.key === "Escape") {
      this.find("#search").clear();
    }
  }

  async onnewfolder(e) {
    let dialog = new NewFolderDialog();
    let result = await dialog.show();
    if (result) {
      this.add_folder(result);
    }
  }

  onmenu(e) {
    this.find("md-drawer").toogle();
  }

  onsave(e) {
    if (this.dirty) {
      this.match("#app").save_case(this.casefile);
      this.mark_clean();
    }
  }

  onupdate() {
    if (!this.state) return;
    this.mark_clean();

    this.casefile = this.state;
    this.main = this.casefile.get(n_main);
    this.topics = this.casefile.get(n_topics);
    this.folders = this.casefile.get(n_folders);
    this.folder = this.casefile.get(n_folders).value(0);
  }

  onupdated() {
    this.find("#caseno").update(this.caseno().toString());
    this.find("folder-list").update(this.folders);
    this.find("topic-list").update(this.folder);
    this.find("md-drawer").update(true);
  }

  caseno() {
    return this.casefile.get(n_caseno);
  }

  name() {
    return this.main.get(n_name);
  }

  next_topic() {
    let next = this.casefile.get(n_next);
    this.casefile.set(n_next, next + 1);
    return next;
  }

  mark_clean() {
    this.dirty = false;
    this.find("#save").disable();
  }

  mark_dirty() {
    this.dirty = true;
    this.find("#save").enable();
  }

  close() {
    if (this.dirty) {
      let msg = `Changes to case #${this.caseno()} has not been saved.`;
      let buttons = {
        "Close without saving": "close",
        "Cancel": "cancel",
        "Save": "save",
      }
      material.StdDialog.choose("Discard changes?", msg, buttons)
      .then(result => {
        if (result == "save") {
          this.match("#app").save_case(this.casefile);
          this.mark_clean();
          app.show_manager();
        } else if (result == "close") {
          this.mark_clean();
          app.show_manager();
        }
      });

    } else {
      app.show_manager();
    }
  }

  folderno(folder) {
    let f = this.folders;
    for (let i = 0; i < f.length; ++i) {
      if (f.value(i) == folder) return i;
    }
    return undefined;
  }

  show_folder(folder) {
    if (folder != this.folder) {
      this.folder = folder;
      this.find("folder-list").update(this.folders);
      this.find("topic-list").update(this.folder);
    }
  }

  add_folder(name) {
    this.folder = new Array();
    this.folders.add(name, this.folder);
    this.find("folder-list").update(this.folders);
    this.find("topic-list").update(this.folder);
    this.mark_dirty();
  }

  rename_folder(folder, name) {
    let pos = this.folderno(folder);
    if (pos > 0 && pos < this.folders.length) {
      this.folders.set_name(pos, name);
      this.find("folder-list").update(this.folders);
      this.mark_dirty();
    }
  }

  move_folder_up(folder) {
    let pos = this.folderno(folder);
    if (pos > 1 && pos < this.folders.length) {
      // Swap with previous folder.
      let tmp_name = this.folders.name(pos);
      let tmp_value = this.folders.value(pos);
      this.folders.set_name(pos, this.folders.name(pos - 1));
      this.folders.set_value(pos, this.folders.value(pos - 1));
      this.folders.set_name(pos - 1, tmp_name);
      this.folders.set_value(pos - 1, tmp_value);
      this.mark_dirty();
      this.find("folder-list").update(this.folders);
    }
  }

  move_folder_down(folder) {
    let pos = this.folderno(folder);
    if (pos > 0 && pos < this.folders.length - 1) {
      // Swap with next folder.
      let tmp_name = this.folders.name(pos);
      let tmp_value = this.folders.value(pos);
      this.folders.set_name(pos, this.folders.name(pos + 1));
      this.folders.set_value(pos, this.folders.value(pos + 1));
      this.folders.set_name(pos + 1, tmp_name);
      this.folders.set_value(pos + 1, tmp_value);
      this.mark_dirty();
      this.find("folder-list").update(this.folders);
    }
  }

  delete_folder(folder) {
    if (folder.length != 0) {
      material.StdDialog.alert("Cannot delete folder",
                      "Folder must be empty to be deleted");
    } else {
      let pos = this.folderno(folder);
      if (pos >= 0 && pos < this.folders.length) {
        this.folders.remove(pos);
        if (pos == this.folders.length) {
          this.folder = this.folders.value(pos - 1);
        } else {
          this.folder = this.folders.value(pos);
        }
        this.find("folder-list").update(this.folders);
        this.find("topic-list").update(this.folder);
        this.mark_dirty();
      }
    }
  }

  add_topic(itemid, name) {
    // Create new topic.
    let topicid = this.next_topic();
    let topic = store.frame(`t/${this.caseno()}/${topicid}`);
    if (itemid) topic.add(n_is, store.lookup(itemid));
    if (name) topic.add(n_name, name);

    // Add topic to current folder.
    this.topics.push(topic);
    this.folder.push(topic);

    // Update topic list.
    let topic_list = this.find("topic-list");
    topic_list.update(this.folder);
    topic_list.scroll_to(topic);
    this.mark_dirty();
  }

  delete_topic(topic) {
    // Do not delete main topic.
    if (topic == this.casefile.get(n_main)) return;

    // Delete topic from case and current folder.
    this.topics.splice(this.topics.indexOf(topic), 1);
    this.folder.splice(this.folder.indexOf(topic), 1);
    this.mark_dirty();

    // Update topic list.
    this.find("topic-list").update(this.folder);
  }

  move_topic_up(topic) {
    let pos = this.folder.indexOf(topic);
    if (pos == -1) return;
    if (pos == 0 || this.folder.length == 1) return;

    // Swap with previous topic.
    let tmp = this.folder[pos];
    this.folder[pos] = this.folder[pos - 1];
    this.folder[pos - 1] = tmp;
    this.mark_dirty();

    // Update topic list.
    this.find("topic-list").update(this.folder);
  }

  move_topic_down(topic) {
    let pos = this.folder.indexOf(topic);
    if (pos == -1) return;
    if (pos == this.folder.length - 1 || this.folder.length == 1) return;

    // Swap with next topic.
    let tmp = this.folder[pos];
    this.folder[pos] = this.folder[pos + 1];
    this.folder[pos + 1] = tmp;
    this.mark_dirty();

    // Update topic list.
    this.find("topic-list").update(this.folder);
  }

  prerender() {
    return `
      <md-column-layout>
        <md-toolbar>
          <md-icon-button id="menu" icon="menu"></md-icon-button>
          <md-toolbar-logo></md-toolbar-logo>
          <div id="title">Case #<md-text id="caseno"></md-text></div>
          <topic-search-box id="search"></topic-search-box>
          <property-search-box id="props"></property-search-box>
          <md-spacer></md-spacer>
          <md-icon-button id="save" icon="save"></md-icon-button>
        </md-toolbar>

        <md-row-layout>
          <md-drawer>
            <div id="home">
              <md-icon-button icon="home"></md-icon-button>
              SLING Cases Home
            </div>
            <div id="folders-top">
              Folders
              <md-spacer></md-spacer>
              <md-icon-button id="newfolder" icon="create_new_folder">
              </md-icon-button>
            </div>
            <folder-list></folder-list>
          </md-drawer>
          <md-content>
            <topic-list></topic-list>
          </md-content>
        </md-row-layout>
      </md-column-layout>
    `;
  }
  static stylesheet() {
    return `
      $ md-toolbar {
        padding-left: 2px;
      }
      $ #title {
        white-space: nowrap;
      }
      $ md-row-layout {
        overflow: auto;
        height: 100%;
      }
      $ md-drawer md-icon {
        color: #808080;
      }
      $ md-drawer md-icon-button {
        color: #808080;
      }
      $ topic-list md-icon {
        color: #808080;
      }
      $ topic-list md-icon-button {
        color: #808080;
        fill: #808080;
      }
      $ md-drawer {
        padding: 3px;
        box-sizing: border-box;
      }
      $ #home {
        display: flex;
        align-items: center;
        padding-right: 16px;
        font-weight: bold;
        white-space: nowrap;
        cursor: pointer;
      }
      $ #folders-top {
        display: flex;
        align-items: center;
        font-size: 16px;
        font-weight: bold;
        margin-left: 6px;
        border-bottom: 1px solid #808080;
        margin-bottom: 6px;
      }
    `;
  }
}

Component.register(CaseEditor);

class TopicSearchBox extends Component {
  onconnected() {
    this.bind("md-search", "query", e => this.onquery(e));
    this.bind("md-search", "item", e => this.onitem(e));
    this.bind("md-search", "enter", e => this.onenter(e));
  }

  onquery(e) {
    let detail = e.detail
    let target = e.target;
    let params = "fmt=cjson";
    let query = detail.trim();
    if (query.endsWith(".")) {
      params += "&fullmatch=1";
      query = query.slice(0, -1);
    }
    params += `&q=${encodeURIComponent(query)}`;

    fetch(`${settings.kbservice}/kb/query?${params}`)
    .then(response => response.json())
    .then((data) => {
      let items = [];
      for (let item of data.matches) {
        items.push(new material.MdSearchResult({
          ref: item.ref,
          name: item.text,
          description: item.description
        }));
      }
      target.populate(detail, items);
    })
    .catch(error => {
      console.log("Query error", query, error.message, error.stack);
      material.StdDialog.error(error.message);
      target.populate(detail, null);
    });
  }

  onenter(e) {
    let name = e.detail;
    this.match("#editor").add_topic(null, name);
  }

  onitem(e) {
    let item = e.detail;
    this.match("#editor").add_topic(item.ref, item.name);
  }

  query() {
    return this.find("md-search").query();
  }

  clear() {
    return this.find("md-search").clear();
  }

  render() {
    return `
      <form>
        <md-search
          placeholder="Search for topic..."
          min-length=2
          autofocus>
        </md-search>
      </form>
    `;
  }

  static stylesheet() {
    return `
      $ {
        display: block;
        width: 100%;
        max-width: 800px;
        padding-left: 10px;
        padding-right: 3px;
      }

      $ form {
        display: flex;
        width: 100%;
      }
    `;
  }
}

Component.register(TopicSearchBox);

class FolderList extends Component {
  render() {
    let folders = this.state;
    if (!folders) return;
    let editor = this.match("#editor");
    if (!editor) return;
    let current = editor.folder;
    let h = [];
    for (let [name, folder] of folders) {
      h.push(new CaseFolder({name, folder, marked: folder == current}));
    }
    return h;
  }
}

Component.register(FolderList);

class CaseFolder extends Component {
  onconnected() {
    this.bind(null, "click", e => this.onclick(e));
    this.bind("#rename", "select", e => this.onrename(e));
    this.bind("#moveup", "select", e => this.onmoveup(e));
    this.bind("#movedown", "select", e => this.onmovedown(e));
    this.bind("#delete", "select", e => this.ondelete(e));
  }

  onclick(e) {
    this.match("#editor").show_folder(this.state.folder);
  }

  async onrename(e) {
    let dialog = new RenameFolderDialog(this.state.name);
    let result = await dialog.show();
    if (result) {
      this.match("#editor").rename_folder(this.state.folder, result);
    }
  }

  onmoveup(e) {
    this.match("#editor").move_folder_up(this.state.folder);
  }

  onmovedown(e) {
    this.match("#editor").move_folder_down(this.state.folder);
  }

  ondelete(e) {
    this.match("#editor").delete_folder(this.state.folder);
  }

  render() {
    return `
      <md-icon icon="folder"></md-icon>
      <div ${this.state.marked ? 'class="current"' : ''}>
        ${Component.escape(this.state.name)}
      </div>
      <md-spacer></md-spacer>
      <md-menu>
        <md-menu-item id="rename">
          <md-icon icon="drive_file_rename_outline"></md-icon>Rename
        </md-menu-item>
        <md-menu-item id="moveup">
          <md-icon icon="move-up"></md-icon>Move up
        </md-menu-item>
        <md-menu-item id="movedown">
          <md-icon icon="move-down"></md-icon>Move down
        </md-menu-item>
        <md-menu-item id="delete">
         <md-icon icon="delete"></md-icon>Delete
        </md-menu-item>
      </md-menu>
    `;
  }

  static stylesheet() {
    return `
      $ {
        display: flex;
        align-items: center;
        padding-left: 6px;
        white-space: nowrap;
        cursor: pointer;
        height: 30px;
        border-radius: 15px;
        border: 0;
        fill: #808080;
      }
      $ md-icon-button button {
        height: 30px;
        width: 30px;
        border-radius: 15px;
      }
      $:hover {
        background-color: #eeeeee;
      }
      $ md-menu #open {
        visibility: hidden;
      }
      $:hover md-menu #open {
        visibility: visible;
      }
      $:hover {
        background-color: #eeeeee;
      }
      $ div {
        padding-left: 6px;
      }
      $ div.current {
        font-weight: bold;
        padding-left: 6px;
      }
    `;
  }
}

Component.register(CaseFolder);

class NewFolderDialog extends material.MdDialog {
  submit() {
    this.close(this.find("#name").value.trim());
  }

  render() {
    let p = this.state;
    return `
      <md-dialog-top>Create new case folder</md-dialog-top>
      <div id="content">
        <md-text-field
          id="name"
          value="${Component.escape(this.state)}"
          label="Folder name">
        </md-text-field>
      </div>
      <md-dialog-bottom>
        <button id="cancel">Cancel</button>
        <button id="submit">Create</button>
      </md-dialog-bottom>
    `;
  }

  static stylesheet() {
    return material.MdDialog.stylesheet() + `
      $ #content {
        display: flex;
        flex-direction: column;
        row-gap: 16px;
      }
      $ #name {
        width: 300px;
      }
    `;
  }
}

Component.register(NewFolderDialog);

class RenameFolderDialog extends material.MdDialog {
  submit() {
    this.close(this.find("#name").value.trim());
  }

  render() {
    let p = this.state;
    return `
      <md-dialog-top>Rename case folder</md-dialog-top>
      <div id="content">
        <md-text-field
          id="name"
          value="${Component.escape(this.state)}"
          label="Folder name">
        </md-text-field>
      </div>
      <md-dialog-bottom>
        <button id="cancel">Cancel</button>
        <button id="submit">Rename</button>
      </md-dialog-bottom>
    `;
  }

  static stylesheet() {
    return material.MdDialog.stylesheet() + `
      $ #content {
        display: flex;
        flex-direction: column;
        row-gap: 16px;
      }
      $ #name {
        width: 300px;
      }
    `;
  }
}

Component.register(RenameFolderDialog);

class TopicList extends Component {
  constructor(state) {
    super(state);
    this.selection = new Set();
  }

  onupdate() {
    this.selection.clear();
  }

  clear_selection() {
    for (let topic of this.selection) {
      this.card(topic).unselect();
    }
    this.selection.clear();
  }

  select(topic, extend) {
    if (!extend) this.clear_selection();
    this.selection.add(topic);
    this.card(topic).select();
  }

  unselect(topic) {
    if (this.selection.has(topic)) {
      this.selection.delete(topic);
      this.card(topic).unselect();
    }
  }

  scroll_to(topic) {
    this.card(topic).scrollIntoView();
  }

  card(topic) {
    for (let i = 0; i < this.children.length; i++) {
      let card = this.children[i];
      if (card.state == topic) return card;
    }
    return null;
  }

  render() {
    let topics = this.state;
    if (!topics) return;
    let h = [];
    for (let topic of topics) {
      h.push(new TopicCard(topic));
    }
    return h;
  }

  static stylesheet() {
    return `
    `;
  }
}

Component.register(TopicList);

class TopicCard extends material.MdCard {
  onconnected() {
    this.bind("#delete", "click", e => this.ondelete(e));
    this.bind("#moveup", "click", e => this.onmoveup(e));
    this.bind("#movedown", "click", e => this.onmovedown(e));
    this.bind("#edit", "click", e => this.onedit(e));
    this.bind("#save", "click", e => this.onsave(e));
    this.bind("#discard", "click", e => this.ondiscard(e));

    this.bind("pre", "keydown", e => this.onkeydown(e));
    this.bind(null, "click", e => this.onclick(e));
    this.update_mode(false);
  }

  update_mode(editing) {
    if (editing == this.editing) return false;
    this.editing = editing;

    this.find("#edit").update(!editing);
    this.find("#delete").update(!editing);
    this.find("#moveup").update(!editing);
    this.find("#movedown").update(!editing);

    this.find("#save").update(editing);
    this.find("#discard").update(editing);

    this.find("pre").setAttribute("contenteditable", editing);
  }

  selected() {
    return this.classList.contains("selected");
  }

  async test(item) {
    let start = performance.now();

    // Retrieve item if needed.
    if (!item.ispublic()) {
      let url = `${settings.kbservice}/kb/topic?id=${item.id}`;
      let response = await fetch(url);
      item = await store.parse(response);
    }

    // Retrieve labels.
    let labels = new LabelCollector(store)
    labels.add(item);
    let labeled = await labels.retrieve();

    if (labeled) {
      let end = performance.now();
      console.log("time:", end - start, "labels", labeled.length);
    }

    this.appendChild(new PropertyPanel(item));
  }


  select() {
    this.classList.add("selected");

    // TODO remove
    let topic = this.state;
    let item = topic.get(n_is);
    if (item) this.test(item);
  }

  unselect() {
    this.classList.remove("selected");
  }

  onedit(e) {
    e.stopPropagation();
    this.update_mode(true);

    let pre = this.find("pre");
    pre.setAttribute("contenteditable", "true");
    pre.focus();
  }

  onsave(e) {
    e.stopPropagation();
    let pre = this.find("pre");
    let content = pre.textContent;
    let frame = store.parse(content);

    this.update(frame);
    this.update_mode(false);
    this.match("#editor").mark_dirty();
  }

  ondiscard(e) {
    this.update(this.state);
    this.update_mode(false);
  }

  async ondelete(e) {
    e.stopPropagation();
    let topic = this.state;
    let result = await material.StdDialog.confirm(
      "Delete topic",
      `Delete topic '${topic.get(n_name)}'?`,
      "Delete");
    if (result) {
      this.match("#editor").delete_topic(topic);
    }
  }

  onmoveup(e) {
    e.stopPropagation();
    this.match("#editor").move_topic_up(this.state);
  }

  onmovedown(e) {
    e.stopPropagation();
    this.match("#editor").move_topic_down(this.state);
  }

  onkeydown(e) {
    if (e.key === "s" && e.ctrlKey && this.editing) {
      this.onsave(e);
      e.stopPropagation();
      e.preventDefault();
    } else if (e.key === "Escape" && this.editing) {
      this.ondiscard(e);
      e.stopPropagation();
      e.preventDefault();
    }
  }

  onclick(e) {
    let topic = this.state;
    let list = this.match("topic-list");
    if (e.ctrlKey) {
      if (this.selected()) {
        list.unselect(topic);
      } else {
        list.select(topic, true);
      }
    } else {
      if (this.selected()) {
        list.clear_selection();
      } else {
        list.select(topic, false);
      }
    }
  }

  prerender() {
    let topic = this.state;
    if (!topic) return;

    return `
      <md-card-toolbar>
        <div>
          <div id="name">${topic.get(n_name)}</div>
          <div id="id">${topic.get(n_id)}</div>
        </div>
        <md-spacer></md-spacer>
        <div id="edit-actions">
          <md-icon-button id="save" icon="save_alt"></md-icon-button>
          <md-icon-button id="discard" icon="cancel"></md-icon-button>
        </div>
        <md-toolbox id="topic-actions">
          <md-icon-button id="edit" icon="edit"></md-icon-button>
          <md-icon-button id="moveup" icon="move-up"></md-icon-button>
          <md-icon-button id="movedown" icon="move-down"></md-icon-button>
          <md-icon-button id="delete" icon="delete"></md-icon-button>
        </md-toolbox>
      </md-card-toolbar>
      <pre spellcheck="false">${Component.escape(topic.text(true))}</pre>
    `;
  }

  static stylesheet() {
    return material.MdCard.stylesheet() + `
      $ {
        margin: 5px 5px 15px 5px;
        border: 1px solid #ffffff;
      }
      $.selected {
        border: 1px solid #d0d0d0;
        box-shadow: rgb(0 0 0 / 16%) 0px 4px 8px 0px,
                    rgb(0 0 0 / 23%) 0px 4px 8px 0px;
      }
      $ #name {
        display: block;
        font-size: 24px;
      }
      $ #id {
        display: block;
        font-size: 13px;
        color: #808080;
        text-decoration: none;
        width: fit-content;
        outline: none;
      }
      $ pre {
        font-size: 12px;
        padding: 6px;
      }
      $ #edit-actions {
        display: flex;
      }
    `;
  }
}

Component.register(TopicCard);

class KbLink extends Component {
  onconnected() {
    this.bind(null, "click", e => this.onclick(e));
  }

  onclick(e) {
    window.open(`${settings.kbservice}/kb/${this.props.ref}`, "_blank");
  }

  static stylesheet() {
    return `
      $ {
        color: #0b0080;
      }

      $:hover {
        cursor: pointer;
      }
    `;
  }
}

Component.register(KbLink);

class PropertyPanel extends Component {
  render() {
    let item = this.state;
    let store = item.store;
    let h = [];

    function propname(prop) {
      let name = prop.get(n_name);
      if (!name) name = prop.id;
      h.push(`<kb-link ref="${prop.id}">`);
      h.push(Component.escape(name));
      h.push('</kb-link>');
    }

    function propval(val) {
      if (val instanceof Frame) {
        let name = val.get(n_name);
        if (!name) name = val.id;
        h.push(`<kb-link ref="${val.id}">`);
        h.push(Component.escape(name));
        h.push('</kb-link>');
      } else {
        h.push(Component.escape(val));
      }
    }

    let prev = null;
    for (let [name, value] of item) {
      if (name == n_id) continue;
      if (name.isproxy()) continue;

      if (name != prev) {
        // Start new property group for new property.
        if (prev != null) h.push('</div></div>');
        h.push('<div class="prop-row">');

        // Property name.
        h.push('<div class="prop-name">');
        propname(name);
        h.push('</div>');
        h.push('<div class="prop-values">');
        prev = name;
      }

      // Property value.
      let v = store.resolve(value);
      h.push('<div class="prop-value">');
      propval(v);
      h.push('</div>');

      // Qualifiers.
      if (v != value) {
        h.push('<div class="qual-tab">');
        let qprev = null;
        for (let [qname, qvalue] of value) {
          if (qname == n_is) continue;
          if (qname.isproxy()) continue;

          if (qname != qprev) {
            // Start new property group for new property.
            if (qprev != null) h.push('</div></div>');
            h.push('<div class="qual-row">');

            // Qualified property name.
            h.push('<div class="qprop-name">');
            propname(qname);
            h.push('</div>');
            h.push('<div class="qprop-values">');
            qprev = qname;
          }

          // Qualified property value.
          h.push('<div class="qprop-value">');
          propval(qvalue);
          h.push('</div>');
        }
        if (qprev != null) h.push('</div></div>');
        h.push('</div>');
      }
    }
    if (prev != null) h.push('</div></div>');

    return h.join("");
  }

  static stylesheet() {
    return `
      $ {
        display: table;
        font-size: 16px;
        border-collapse: collapse;
        width: 100%;
        table-layout: fixed;
      }

      $ .prop-row {
        display: table-row;
        border-top: 1px solid lightgrey;
      }

      $ .prop-row:first-child {
        display: table-row;
        border-top: none;
      }

      $ .prop-name {
        display: table-cell;
        font-weight: 500;
        width: 20%;
        padding: 8px;
        vertical-align: top;
        overflow-wrap: break-word;
      }

      $ .prop-values {
        display: table-cell;
        vertical-align: top;
        padding-bottom: 8px;
      }

      $ .prop-value {
        padding: 8px 8px 0px 8px;
        overflow-wrap: break-word;
      }

      $ .prop-lang {
        color: #808080;
        font-size: 13px;
      }

      $ .prop-value a {
        color: #0b0080;
        text-decoration: none;
        cursor: pointer;
        outline: none;
      }

      $ .qual-tab {
        display: table;
        border-collapse: collapse;
      }

      $ .qual-row {
        display: table-row;
      }

      $ .qprop-name {
        display: table-cell;
        font-size: 13px;
        vertical-align: top;
        padding: 1px 3px 1px 30px;
        width: 150px;
      }

      $ .qprop-values {
        display: table-cell;
        vertical-align: top;
      }

      $ .qprop-value {
        font-size: 13px;
        vertical-align: top;
        padding: 1px 1px 1px 1px;
      }

      $ .qprop-value a {
        color: #0b0080;
        text-decoration: none;
        cursor: pointer;
        outline: none;
      }
    `;
  }
}

Component.register(PropertyPanel);

material.MdIcon.custom("move-down", `
<svg width="24" height="24" viewBox="0 0 32 32">
  <g><polygon points="30,16 22,16 22,2 10,2 10,16 2,16 16,30"/></g>
</svg>
`);

material.MdIcon.custom("move-up", `
<svg width="24" height="24" viewBox="0 0 32 32">
  <g><polygon points="30,14 22,14 22,28 10,28 10,14 2,14 16,0"/></g>
</svg>
`);

