require('babel-core/register')({ presets: ['env', 'react']}); // ES6 JS below!
import React from './ReactFake';
import Details from './Details'

export default class DetailsError extends Details {
    constructor(itemid, item, message) {
        super(itemid, item);
        this.message = message;
    }
    theatreIaWrap() {
        return (
        <div class="dweb-message">
            {this.message}
        </div>
        )
    }
    render(res) {
        super.render(res)
    }
    itemDetailsAboutJSX() { }
}
