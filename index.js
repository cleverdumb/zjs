const fs = require('fs');
const util = require('util');

fs.readFile('index.zjs','utf-8',(err,data)=>{
    if (err) throw err;
    // frag(data);
    // util.inspect(frag(data),false,null,true)
    frag(data);
})

let frags = [];
// let index = 0;
let definedFrags = [];
// let structuredFrags = []

let operators = ['+','-','*','/','^','as'];
let operatorR = /\+|\-|\*|\/|\^|as/;
let keywords = ['define'];
let keywordR = /define/;
let numberR = /^[0-9]*\.?[0-9]*e-?[0-9]*|^-?[0-9]*\.?[0-9]*/;
let refR = /[a-zA-Z]+[a-zA-Z0-9$#]*/;
let stringR = /".*"|'.*'/;
let booleanR = /true|false/
let literalTypes = ['string','number','boolean'];

let structures = [
    '^','*','/','+','-'
]

let operatorInputs = {
    '+':['left','right'],
    '-':['left','right'],
    '*':['left','right'],
    '/':['left','right'],
    '^':['left','right']
};
// console.log(structures);

function frag(data) {
    // let frags = [];
    // let definedFrags = [];

    // debugger;
    while (data.length > 0) {
        data = decode(data,frags);
        // return frag(data,frags);
    }
    // console.log(frags);
    frags = frags.filter(x=>x!==' ');
    // debugger;
    definedFrags = define(frags,definedFrags);
    // console.log('defined');
    // console.dir(definedFrags);
    // debugger;
    let constructed = construct(definedFrags);
    // console.log('constructed');
    console.log(util.inspect(constructed,{depth:null}));
    // debugger;
    let evaluated = evaluate(constructed);
    // debugger;
    // console.log('evaluated');
    console.dir(evaluated);

    // console.log(constructed);
    // console.log(util.inspect(constructed,false,null,true));
    // console.log(structuredFrags);
    // console.log(frags);

    

    return evaluated;

    // return {};
}

function decode(data,frags) {
    // console.log('decode -------------------------------------------------------------------');
    // console.log(data);
    if (data[0]==' ') {
        return data.slice(1);
    }
    if (data.search(keywordR)==0) {
        let word = data.match(keywordR)[0];
        // console.log(data.match(keywords)[0]);
        let length = word.length;
        frags.push(word);
        return data.slice(length);
    }
    if (data.search(operatorR)==0) {
        let word = data.match(operatorR)[0];
        // console.log(data.match(keywords)[0]);
        let length = word.length;
        frags.push(word);
        return data.slice(length);
    }
    // console.log(data.search(numberR));
    if (data.search(numberR)==0 && data.match(numberR)[0].length>0) {
        // console.log(data.match(numberR));
        let num = data.match(numberR)[0];
        // console.log(num);
        let length = num.length;
        frags.push(num);
        return data.slice(length);
    }
    if (data[0]=='(') {
        // console.log('bracket found')
        let open = 0;
        let c = 0;
        for (let x of data) {
            // if (c==0) continue;
            // console.log(x);
            if (x == '(') open++;
            if (x == ')') open--;
            // console.log(open);
            // console.log(c);
            if (open === 0 && c!=0) {
                // console.log('extracted: ');
                // console.log(data.substring(1,c));
                let extracted = data.slice(0,c+1);
                // console.log(extracted);
                frags.push(extracted);
                // data = data.substring(c+1,data.length);
                return data.slice(c+1);
                // break;
            }
            c++;
        }
        throw unexpectedToken('(');
    }
    if (data[0]=='"') {
        let next = data.indexOf('"',1);
        if (next === -1) {
            throw unexpectedToken('"');
        }
        else {
            frags.push(data.substring(0,next+1));
            return data.substring(next+1);
        }
    }
    if (data[0]=='\'') {
        let next = data.indexOf('\'',1);
        if (next === -1) {
            throw unexpectedToken('\'');
        }
        else {
            frags.push(data.substring(0,next+1));
            return data.substring(next+1);
        }
    }
    if (data.search(booleanR)==0) {
        let bool = data.match(booleanR)[0];
        let len = bool.length;
        frags.push(bool);
        return data.slice(len);
    }
    let word = data.match(refR)?.[0];
    // console.log(data.match(keywords)[0]);
    let length = word.length;
    frags.push(word);
    return data.slice(length);
}

function define(f,definedFrags) {
    // console.log('part');
    // console.log(definedFrags);
    // console.log(f);
    f.forEach((x,i)=>{
        if (x.type) definedFrags.push(x);
        // console.log(x.match(booleanR));
        // console.log(x.match(stringR));
        if (operators.includes(x)) {
            definedFrags.push({type:'operator',content:x});
        }
        else if (keywords.includes(x)) {
            definedFrags.push({type:'keyword',content:x});
        }
        else if (x.match(numberR)?.[0].length == x.length) {
            definedFrags.push({type:'number',content:x});
        }
        else if (x[0]=='(' && x[x.length-1]==')') {
            // definedFrags.push({type:'eval',content:x.substring(1,x.length-1)})
            // frags = [];
            // definedFrags = [];
            // definedFrags.push(frag(x.substring(1,x.length-1)));
            let data = x.substring(1,x.length-1);
            let part = [];
            while (data.length>0) {
                data = decode(data,part);
            }
            // console.log('data');
            // console.log(part);
            // part = [];
            let part2 = [];
            part2 = define(part,part2);
            // console.log('bracket in definition');
            // console.log((decode(x.substring(1,x.length-1))));
            // console.log(data);
            // console.log(part2);
            // console.log('thing');
            // console.log(frags);
            part2 = construct(part2);
            // f[i] = part2;
            part2.forEach(x=>{
                definedFrags.push(x);
            })
            // console.log('frags');
            // console.log(f);
            // console.log(definedFrags);
            // console.log(definedFrags);
        }
        else if (x.match(stringR)?.[0] == x) {
            definedFrags.push({type:'string',content:x.substring(1,x.length-1)});
        }
        else if (x.match(booleanR)?.[0] == x) {
            definedFrags.push({type:'boolean',content:x});
        }
        else {
            definedFrags.push({type:'reference',content:x});
        }
    })
    return definedFrags;
}

// let needToDelete = false;

// function construct(frag) {
//     frag.forEach((x,i)=>{
//         if (needToDelete && !x.content in structures) {
//             needToDelete = false;
//             return;
//         }
//         else if (needToDelete) {
//             needToDelete = false;
//         }
//         // console.log(x);
//         if (x.type == 'operator' && x.content in structures) {
//             let obj = {};
//             if (structures[x.content]?.left) {
//                 // console.log(`${x.content} left`);
//                 if (i==0) {
//                     throw new Error(`Unexpected token: ${x.content}`);
//                 }
//                 else {
//                     structuredFrags.pop();
//                     obj.left = frag[i-1];
//                 }
//             }
//             if (structures[x.content]?.right) {
//                 // console.log(`${x.content} right`);
//                 if (i>=frag.length-1) {
//                     throw new Error(`Can't find target for: ${x.content}`);
//                 }
//                 else {
//                     obj.right = frag[i+1];
//                     needToDelete = true;
//                 }
//             }
//             obj.content = x.content;
//             structuredFrags.push(obj);
//         }
//         else {
//             structuredFrags.push(x);
//         }
//     })
//     return structuredFrags;
// }

function unexpectedToken(token) {
    return new Error(`Unexpected token ${token}`);
}

let copy = [];

function construct(frag,iter=0) {
    if (iter < structures.length) {
        copy = [...frag];
        frag = [];
        // console.log('now operator: ' + structures[iter])
        copy.forEach((x,i)=>{
            // console.log(x);
            if (x.type != 'operator' || x.content!=structures[iter]) {
                if (copy[i-1]?.type == 'operator' && operatorInputs[copy[i-1]?.content]?.includes('right') && copy[i-1]?.content==structures[iter]) {
                    frag[frag.length-1].right = x;
                    // console.log(`put ${x.content} into ${frag[frag.length-1].content}`)
                }
                else {
                    // console.log(`push ${x.content}`);
                    frag.push(x);
                }
                return;
            }
            // console.log('back');
            // console.log(copy[i-1]);
            if (copy[i-1]?.type=='operator' && (!copy[i-1]?.right && copy[i-1])) {
                // console.log('unexpected');
                throw unexpectedToken(x.content);
            }
            let obj = Object.assign({},x);
            if (operatorInputs[x.content].includes('left') && !x.left && x.content==structures[iter]) {
                // console.log(obj);
                // console.log('put left: ' + frag[frag.length-1].content);
                // x.left = 'something'
                let popped = frag.pop();
                // console.log(`popped: ${popped.content}`);
                x.left = popped;
                // console.log(frag)
            }
            frag.push(x);
        })

        iter++;
        // console.log(frag);
        return construct(frag,iter);
    }
    return frag;
}

function evaluate(frag) {
    // console.log('frag in evaluate');
    // console.log(util.inspect(frag,{depth:null}));
    return frag.map(x=>{
        return evalS(x);
    });
}

function evalS(x) {
    if (x.type == 'operator') {
        let structure = operatorInputs[x.content];
        let left, right;
        // let obj = {};
        if (structure.includes('left')) {
            if (!x.left) throw unexpectedToken(x.content);
            if (literalTypes.includes(x.left.type)) {
                left = x.left;
            }
            // if (x.left.type == 'eval') {
            //     frags = [];
            //     definedFrags = [];
            //     obj.left = frag(x.left.content);
            //     console.log(x.left.content);
            //     // left = x.left;
            // }
            else {
                left = evalS(x.left);
            }
        }
        if (structure.includes('right')) {
            if (!x.right) throw unexpectedToken(x.content);
            if (literalTypes.includes(x.right.type)) {
                right = x.right;
            }
            // if (x.right.type == 'eval') {
            //     frags = [];
            //     definedFrags = [];
            //     obj.right = frag(x.right.content);
            //     console.log('right eval');
            //     console.log(x.right.content);
            //     // right = x.right
            // }
            else {
                right = evalS(x.right);
            }
        }
        // console.log(util.inspect(x,{depth:null}));
        // console.log('left');
        // console.dir(left);
        // console.log('right');
        // console.dir(right);
        return execute(x.content,left,right);
        // return Object.assign(obj,x);
    }
    else {
        return x;
    }
}

function execute(content,left,right) {
    switch (content) {
        case '+':
            return {type:'number',content:(Number(left.content)+Number(right.content)).toString()};
        case '-':
            return {type:'number',content:(Number(left.content)-Number(right.content)).toString()};
        case '*':
            return {type:'number',content:(Number(left.content)*Number(right.content)).toString()};
        case '/':
            return {type:'number',content:(Number(left.content)/Number(right.content)).toString()};
        case '^':
            return {type:'number',content:(Number(left.content)**Number(right.content)).toString()};
    }
}