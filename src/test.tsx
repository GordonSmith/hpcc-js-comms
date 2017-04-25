export class Test {
    classID() {
        return "myCLass";
    }

    id() {
        return "myID";
    }

    createElement(_component, _attrs, ..._children) {
        debugger;
    }

    repeat(props) {
        const items = [];
        for (let i = 0; i < props.numTimes; i++) {
            items.push(props.children(i));
        }
        return <div>{items}</div>;
    }

    doTest() {
        return <div class={this.classID()} id={this.id()}>
            Here is a list:
            <ul>
                <li>Item 1</li>
                <li>Item 2</li>
            </ul>
            <ul>
                <this.repeat numTimes={10}>
                    {(index) => <div key={index}>This is item {index} in the list</div>}
                </this.repeat>
            </ul>
        </div>;
    }
}

const tmp = new Test();
tmp.doTest();
