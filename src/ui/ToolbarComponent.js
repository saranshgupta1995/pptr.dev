/**
 * Copyright 2018 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {html} from './html.js';

export class ToolbarComponent {
  constructor() {
    this.element = html`
      <toolbar-component>
        <toolbar-section class=left></toolbar-section>
        <toolbar-section class=middle></toolbar-section>
        <toolbar-section class=right></toolbar-section>
      </toolbar-component>
    `;
  }

  left() {
    return this.element.$('.left');
  }

  middle() {
    return this.element.$('.middle');
  }

  right() {
    return this.element.$('.right');
  }
}

