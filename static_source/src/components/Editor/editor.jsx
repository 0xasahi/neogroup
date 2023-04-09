import './editor.scss';

import React, {useCallback, useState, useMemo, forwardRef} from 'react';
import isUrl from 'is-url';
import isHotkey from 'is-hotkey';
import ReactDOM from 'react-dom';
import escapeHtml from 'escape-html';
import imageExtensions from 'image-extensions';
import {jsx} from 'slate-hyperscript';
import {
    Editable,
    withReact,
    useSlate,
    Slate,
    useSelected,
    useSlateStatic,
    ReactEditor,
    useFocused,
} from 'slate-react';
import {Editor, Transforms, createEditor, Element as SlateElement, Range, Text} from 'slate';
import {withHistory} from 'slate-history';
import axiosInstance from '../../common/axios';
import {FediIcon, SendIcon} from '../../common/utils';


const ELEMENT_TAGS = {
    A: el => ({type: 'link', url: el.getAttribute('href')}),
    BLOCKQUOTE: () => ({type: 'quote'}),
    H1: () => ({type: 'heading-one'}),
    H2: () => ({type: 'heading-two'}),
    H3: () => ({type: 'heading-three'}),
    H4: () => ({type: 'heading-four'}),
    H5: () => ({type: 'heading-five'}),
    H6: () => ({type: 'heading-six'}),
    IMG: el => ({type: 'image', url: el.getAttribute('src')}),
    LI: () => ({type: 'list-item'}),
    OL: () => ({type: 'numbered-list'}),
    P: () => ({type: 'paragraph'}),
    PRE: () => ({type: 'pre'}),
    UL: () => ({type: 'bulleted-list'}),
}

// COMPAT: `B` is omitted here because Google Docs uses `<b>` in weird ways.
const TEXT_TAGS = {
    CODE: () => ({code: true}),
    DEL: () => ({strikethrough: true}),
    EM: () => ({italic: true}),
    I: () => ({italic: true}),
    S: () => ({strikethrough: true}),
    STRONG: () => ({bold: true}),
    U: () => ({underline: true}),
    H: () => ({mark: true}),
}


const FORWARD_KEYS = [
    'ArrowRight',
    'ArrowDown',
]

const BACKWARD_KEYS = [
    'ArrowLeft',
    'ArrowUp'
]

const ARROW_KEYS = [...FORWARD_KEYS, ...BACKWARD_KEYS];

export const deserialize = el => {
    if (el.nodeType === 3) {
        return el.textContent
    } else if (el.nodeType !== 1) {
        return null
    } else if (el.nodeName === 'BR') {
        return '\n'
    }

    const {nodeName} = el
    let parent = el

    if (
        nodeName === 'PRE' &&
        el.childNodes[0] &&
        el.childNodes[0].nodeName === 'CODE'
    ) {
        parent = el.childNodes[0]
    }

    let children = Array.from(parent.childNodes)
        .map(deserialize)
        .flat()

    if (children.length === 0) {
        children = [{text: ''}]
    }

    if (el.nodeName === 'BODY') {
        return jsx('fragment', {}, children)
    }

    if (ELEMENT_TAGS[nodeName]) {
        const attrs = ELEMENT_TAGS[nodeName](el)
        return jsx('element', attrs, children)
    }

    if (TEXT_TAGS[nodeName]) {
        const attrs = TEXT_TAGS[nodeName](el)
        return children.map(child => jsx('text', attrs, child))
    }

    return children
}


const withHtml = editor => {
    const {insertData, isInline, isVoid} = editor
    editor.isInline = element => {
        return element.type === 'link' ? true : isInline(element)
    }
    editor.isVoid = element => {
        return element.type === 'image' ? true : isVoid(element)
    }
    editor.insertData = data => {
        const html = data.getData('text/html')
        if (html) {
            const parsed = new DOMParser().parseFromString(html, 'text/html')
            const fragment = deserialize(parsed.body)
            Transforms.insertFragment(editor, fragment)
            return
        }
        insertData(data)
    }
    return editor
}

const Button = forwardRef((props, ref) => {
    const {className, active, ...restProps} = props;
    return (
        <span
            {...restProps}
            ref={ref}
            className={`material-icons editor-button${active ? ' active' : ''}`}
        />
    );
});

const Toolbar = forwardRef((props, ref) => {
    const {className, ...restProps} = props;
    return (
        <div
            {...restProps}
            ref={ref}
            className='editor-toolbar'
        />
    );
});

const HOTKEYS = {
    'mod+b': 'bold',
    'mod+i': 'italic',
    'mod+u': 'underline',
    'mod+`': 'code',
    'mod+m': 'mark',
    'mod+e': 'strikethrough',
};

const BLOCK_HOTKEYS = {
    'mod+1': 'heading-one',
    'mod+2': 'heading-two',
    'mod+3': 'heading-three',
    'mod+shift+`': 'pre',
    'mod+q': 'quote',
}

const LIST_TYPES = ['numbered-list', 'bulleted-list'];
const TEXT_ALIGN_TYPES = ['left', 'center', 'right', 'justify'];


const upload = async (image) => {

    const formData = new FormData();
    formData.append('image', image);

    return await axiosInstance.post('/markdownx/upload/', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'X-Requested-With': 'XMLHttpRequest',
        }
    }).then((res) => res.data.image_code.slice(4, -1)
    )
}

const withImages = (editor) => {
    const {insertData, isVoid} = editor;
    editor.isVoid = (element) => {
        return element.type === 'image' ? true : isVoid(element);
    };
    editor.insertData = (data) => {
        const text = data.getData('text/plain');
        const {files} = data;

        if (files && files.length > 0) {
            for (const file of files) {
                const reader = new FileReader();
                const [mime] = file.type.split('/');
                if (mime === 'image') {
                    reader.addEventListener('load', () => {
                        upload(file).then((url) => {
                            insertImage(editor, url);
                        });
                    });
                    reader.readAsDataURL(file);
                }
            }
        } else if (isImageUrl(text)) {
            insertImage(editor, text);
        } else {
            insertData(data);
        }
    };

    return editor;
};

const withInlines = (editor) => {
    const {insertData, insertText, isInline, isElementReadOnly, isSelectable} = editor;

    editor.isInline = (element) => ['link', 'button', 'badge'].includes(element.type) || isInline(element);
    editor.isElementReadOnly = (element) => element.type === 'badge' || isElementReadOnly(element);
    editor.isSelectable = (element) => element.type !== 'badge' && isSelectable(element);
    editor.insertText = (text) => {
        if (text && isUrl(text)) {
            wrapLink(editor, text);
        } else {
            insertText(text);
        }
    };

    editor.insertData = (data) => {
        const text = data.getData('text/plain');
        if (text && isUrl(text)) {
            wrapLink(editor, text);
        } else {
            insertData(data);
        }
    };

    return editor;
};

const insertImage = (editor, url) => {
    const text = {text: ''};
    const image = {type: 'image', url, children: [text]};

    Transforms.insertNodes(editor, image);
    Transforms.insertNodes(editor, {
        type: 'paragraph',
        children: [text],
    });
};

const Image = ({attributes, children, element}) => {
    const editor = useSlateStatic();
    const path = ReactEditor.findPath(editor, element);

    const selected = useSelected();
    const focused = useFocused();
    return (
        <div {...attributes} onClick={
            () => {
                Transforms.select(editor, path);
            }
        }>
            <div contentEditable={false} style={{display: 'flex', justifyContent: 'center', lineHeight: 0}}>
                <img
                    src={element.url}
                    style={{
                        boxShadow: `${(selected) ? '0 0 0 2px #8671B5aa' : 'none'}`
                    }}
                />
                <Button
                    onClick={() => Transforms.removeNodes(editor, {at: path})}
                >
                    <span>delete</span>
                </Button>
            </div>
            {children}
        </div>
    );
};

const InsertImageButton = () => {

    const editor = useSlateStatic();
    const [value, setValue] = React.useState('');
    const [open, setOpen] = React.useState(false);

    const handleChange = (e) => {
        let v = e.target.value;
        setValue(v);
    };

    const submit = (e) => {
        e.preventDefault();
        if (value && !isImageUrl(value)) {
            alert('该链接不是一张图片');
            return;
        }
        value && insertImage(editor, value);
        setValue('');
        setOpen(false);
    };

    const handleClose = (e) => {
        e.preventDefault();
        setOpen(false);
    };

    return (
        <div className="image">
            <Button
                onMouseDown={(event) => {
                    event.preventDefault();
                    setOpen(true);
                }}
            >
                <span>image</span>
            </Button>
            {open && (
                <modal className="image-opened">
                    <input
                        type="text"
                        value={value}
                        placeholder="输入链接..."
                        onChange={handleChange}
                    />
                    <div >
                        <button
                            type="button"
                            onMouseDown={handleClose}
                        >
                            关闭
                        </button>
                        <button
                            type="button"
                            onMouseDown={submit}
                        >
                            好了
                        </button>
                    </div>
                </modal>
            )}
        </div>
    );
};

const isImageUrl = (url) => {
    if (!url) return false;
    if (!isUrl(url)) return false;
    const ext = new URL(url).pathname.split('.').pop();
    return imageExtensions.includes(ext);
};

const toggleBlock = (editor, format) => {
    const isActive = isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type');
    const isList = LIST_TYPES.includes(format);

    Transforms.unwrapNodes(editor, {
        match: (n) =>
            !Editor.isEditor(n) &&
            SlateElement.isElement(n) &&
            LIST_TYPES.includes(n.type) &&
            !TEXT_ALIGN_TYPES.includes(format),
        split: true,
    });

    let newProperties;
    if (TEXT_ALIGN_TYPES.includes(format)) {
        newProperties = {
            align: isActive ? undefined : format,
        };
    } else {
        newProperties = {
            type: isActive ? 'paragraph' : isList ? 'list-item' : format,
        };
    }
    Transforms.setNodes(editor, newProperties);

    if (!isActive && isList) {
        const block = {type: format, children: []};
        Transforms.wrapNodes(editor, block);
    }
};

const toggleMark = (editor, format) => {
    const isActive = isMarkActive(editor, format);

    if (isActive) {
        Editor.removeMark(editor, format);
    } else {
        Editor.addMark(editor, format, true);
    }
};

const isBlockActive = (editor, format, property = 'type') => {
    const [match] = Editor.nodes(editor, {
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n[property] === format,
    });

    return !!match;
};

const isMarkActive = (editor, format) => {
    const marks = Editor.marks(editor);
    return marks ? marks[format] === true : false;
};

const BlockButton = ({format, icon}) => {
    const editor = useSlate();
    return (
        <Button
            active={isBlockActive(editor, format, TEXT_ALIGN_TYPES.includes(format) ? 'align' : 'type')}
            onMouseDown={(event) => {
                event.preventDefault();
                toggleBlock(editor, format);
            }}
        >
            <span>{icon}</span>
        </Button>
    );
};

const MarkButton = ({format, icon}) => {
    const editor = useSlate();
    return (
        <Button
            active={isMarkActive(editor, format)}
            onMouseDown={(event) => {
                event.preventDefault();
                toggleMark(editor, format);
            }}
        >
            <span>{icon}</span>
        </Button>
    );
};

const isLinkActive = (editor) => {
    const [link] = Editor.nodes(editor, {match: (n) => n.type === 'link'});
    return !!link;
};

const unwrapLink = (editor) => {
    Transforms.unwrapNodes(editor, {
        match: (n) => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'link',
    });
};

const wrapLink = (editor, url) => {
    if (isLinkActive(editor)) {
        unwrapLink(editor);
    }

    const {selection} = editor;
    const isCollapsed = selection && Range.isCollapsed(selection);
    const link = {
        type: 'link',
        url,
        children: isCollapsed ? [{text: url}] : [],
    };

    if (isCollapsed) {
        Transforms.insertNodes(editor, link);
    } else {
        Transforms.wrapNodes(editor, link, {split: true});
        Transforms.collapse(editor, {edge: 'end'});
    }
};

const LinkButton = ({format, icon}) => {
    const editor = useSlate();
    const [value, setValue] = React.useState('');
    const [open, setOpen] = React.useState(false);

    const handleChange = (e) => {
        let v = e.target.value;
        if (!v) return;
        setValue(v);
    };

    const submit = (e) => {
        e.preventDefault();
        wrapLink(editor, value);
        setOpen(false);
    };

    const handleClose = (e) => {
        e.preventDefault();
        setOpen(false);
    };

    return (
        <div className="link">
            <Button
                active={isLinkActive(editor)}
                onMouseDown={(event) => {
                    event.preventDefault();
                    setOpen(true);
                }}
            >
                <span>{icon}</span>
            </Button>
            {open && (
                <modal className="link-opened">
                    <input
                        type="text"
                        value={value}
                        placeholder="输入链接..."
                        onChange={handleChange}
                    />

                    <div>
                        <button
                            type="button"
                            onMouseDown={handleClose}
                        >
                            关闭
                        </button>
                        <button
                            type="button"
                            onMouseDown={submit}
                        >
                            好了
                        </button>
                    </div>
                </modal>
            )}
        </div>
    );
};

const InlineChromiumBugfix = () => (
    <span
        contentEditable={false}
        style={{
            'fontSize': 0
        }}
    >
        ${String.fromCodePoint(160) /* Non-breaking space */}
    </span>
);

const Link = React.forwardRef(({attributes, children, element, style}, ref) => {
    return (
        <a target='_blank' {...attributes} href={element.url} ref={ref} style={{display: 'inline'}}>
            <InlineChromiumBugfix />
            {children}
            <InlineChromiumBugfix />
        </a>
    );
});

const RemoveLinkButton = () => {
    const editor = useSlate();

    return (
        <Button
            active={isLinkActive(editor)}
            onMouseDown={() => {
                if (isLinkActive(editor)) {
                    unwrapLink(editor);
                }
            }}
        >
            <span>link_off</span>
        </Button>
    );
};

const serialize = node => {
    if (Array.isArray(node)) {
        return node.map(n => serialize(n)).join('')
    }

    if (Text.isText(node)) {
        let string = escapeHtml(node.text)
        if (node.code) {
            string = `<code>${string}</code>`
        }
        if (node.bold) {
            string = `<strong>${string}</strong>`
        }
        if (node.mark) {
            string = `<mark>${string}</mark>`
        }
        if (node.strikethrough) {
            string = `<del>${string}</del>`
        }
        if (node.italic) {
            string = `<em>${string}</em>`
        }
        if (node.underline) {
            string = `<u>${string}</u>`
        }
        return string
    }

    const children = node.children?.map(n => serialize(n)).join('') || ' '
    const alignStyle = node.align ? ` style="text-align: ${node.align}"` : '';

    switch (node.type) {
        case 'quote':
            return `<blockquote>${children}</blockquote>`
        case 'link':
            return `<a target='_blank' href="${escapeHtml(node.url)}">${children}</a>`
        case 'heading-one':
            return `<h1${alignStyle}>${children}</h1>`
        case 'pre':
            return `<pre>${children}</pre>`
        case 'heading-two':
            return `<h2${alignStyle}>${children}</h2>`
        case 'heading-three':
            return `<h3${alignStyle}>${children}</h3>`
        case 'bulleted-list':
            return `<ul>${children}</ul>`
        case 'list-item':
            return `<li>${children}</li>`
        case 'numbered-list':
            return `<ol>${children}</ol>`
        case 'image':
            return `<img src="${escapeHtml(node.url)}" />`
        case 'paragraph':
        default:
            return children ? `<p${alignStyle}>${children}</p>` : ''
    }

}

const Element = ({attributes, children, element}) => {
    const style = {textAlign: element.align};
    switch (element.type) {
        case 'quote':
            return (
                <blockquote style={style} {...attributes}>
                    {children}
                </blockquote>
            );
        case 'bulleted-list':
            return (
                <ul style={style} {...attributes}>
                    {children}
                </ul>
            );
        case 'heading-one':
            return (
                <h1 style={style} {...attributes}>
                    {children}
                </h1>
            );
        case 'heading-two':
            return (
                <h2 style={style} {...attributes}>
                    {children}
                </h2>
            );
        case 'heading-three':
            return (
                <h3 style={style} {...attributes}>
                    {children}
                </h3>
            );
        case 'list-item':
            return (
                <li style={style} {...attributes}>
                    {children}
                </li>
            );
        case 'numbered-list':
            return (
                <ol style={style} {...attributes}>
                    {children}
                </ol>
            );
        case 'pre':
            return <pre style={style} {...attributes}>
                {children}
            </pre>
        case 'link':
            return <Link style={style} {...attributes} element={element} children={children} />;
        case 'image':
            return <Image style={style} {...attributes} element={element} children={children} />;
        case 'paragraph':
        default:
            return (
                <p style={style} {...attributes}>
                    {children}
                </p>
            );
    }
};

const Leaf = ({attributes, children, leaf}) => {
    if (leaf.bold) {
        children = <strong>{children}</strong>;
    }

    if (leaf.mark) {
        children = <mark>{children}</mark>;
    }

    if (leaf.strikethrough) {
        children = <del>{children}</del>
    }

    if (leaf.underline) {
        children = <u>{children}</u>;
    }
    if (leaf.code) {
        children = <code>{children}</code>;
    }

    if (leaf.italic) {
        children = <em>{children}</em>;
    }


    return <span {...attributes}>{children}</span>;
};


const NeoGrpEditor = (props) => {

    const [title, setTitle] = useState(props.title);
    const [sendingState, setSendingState] = useState({
        sending: false,
        share_to_mastodon: true,
    });

    const editorValue = useMemo(
        () =>
            props.initValue || JSON.parse(localStorage.getItem('content')) || [
                {
                    type: 'paragraph',
                    children: [{text: ''}],
                },
            ],
        []
    )
    const renderElement = useCallback((props) => <Element {...props} />, []);
    const renderLeaf = useCallback((props) => <Leaf {...props} />, []);

    const editor = useMemo(() => withHtml(withImages(withInlines(withHistory(withReact(createEditor()))))), []);

    const submitContent = async () => {
        if (!title) {
            alert('请输入标题')
            return;
        }

        const html = serialize(editor.children);
        await axiosInstance.post(props.api,
            {
                content: html,
                title: title,
                share_to_mastodon: sendingState.share_to_mastodon
            }, {'content-type': 'application/json'}
        ).then((res) => {
            if (res.status == 200 && res.data && res.data.r === 0) {
                window.location.href = res.data.data.redirect_uri;
                localStorage.removeItem('content');
            }
            else {
                alert(res.data.msg);
            }
        })
    }

    const toggleShareToMastodon = () => {
        setSendingState({
            ...sendingState,
            share_to_mastodon: !sendingState.share_to_mastodon
        })
    }

    return (
        <div className='editor'>
            <Slate
                editor={editor}
                value={editorValue}
                onChange={(value) => {
                    const isAstChange = editor.operations.some((op) => 'set_selection' !== op.type);
                    if (isAstChange) {
                        const content = JSON.stringify(value);
                        localStorage.setItem('content', content);
                    }
                }}
            >
                <div className='editor-header'>
                    <div className='editor-action'>
                        <input type="text" value={title} placeholder="请输入标题" onChange={(e) => setTitle(e.target.value)} />
                        <div className={`share-to-mastodon${sendingState.share_to_mastodon ? ' yes' : ''}`} onClick={toggleShareToMastodon} ><FediIcon /></div>
                        <div className='submit' onClick={submitContent} disabled={sendingState.sending} >
                            <SendIcon />
                        </div>
                    </div>
                    <Toolbar>
                        <BlockButton format="heading-one" icon="looks_one" />
                        <BlockButton format="heading-two" icon="looks_two" />
                        <BlockButton format="heading-three" icon="looks_3" />
                        <MarkButton format="bold" icon="format_bold" />
                        <MarkButton format="italic" icon="format_italic" />
                        <MarkButton format="underline" icon="format_underlined" />
                        <MarkButton format="mark" icon="format_color_text" />
                        <MarkButton format="strikethrough" icon="format_strikethrough" />
                        <BlockButton format="pre" icon="code" />
                        <LinkButton format="link" icon="link" />
                        <RemoveLinkButton format="link" icon="link_off" />
                        <InsertImageButton format="image" icon="image" />
                        <BlockButton format="quote" icon="format_quote" />
                        <BlockButton format="numbered-list" icon="format_list_numbered" />
                        <BlockButton format="bulleted-list" icon="format_list_bulleted" />
                        <BlockButton format="center" icon="format_align_center" />
                    </Toolbar>
                </div>

                <Editable
                    renderElement={renderElement}
                    renderLeaf={renderLeaf}
                    placeholder="发布内容"
                    spellCheck
                    autoFocus={true}
                    className="editor-content"
                    selection={editor.selection}
                    onKeyDown={(event) => {
                        const key = event.key;

                        for (const hotkey in HOTKEYS) {
                            if (isHotkey(hotkey, event)) {
                                event.preventDefault();
                                const mark = HOTKEYS[hotkey];
                                toggleMark(editor, mark);
                                return;
                            }
                        }

                        for (const hotkey in BLOCK_HOTKEYS) {
                            if (isHotkey(hotkey, event)) {
                                event.preventDefault();
                                const block = BLOCK_HOTKEYS[hotkey];
                                toggleBlock(editor, block);
                                return;
                            }
                        }

                        if (key === " " && event.ctrlKey) {
                            event.preventDefault();
                            Transforms.insertNodes(
                                editor,
                                {
                                    text: " ",
                                    marks: [],
                                },
                            )
                            return;
                        }


                        else if (key === "Enter" && event.ctrlKey) {
                            event.preventDefault();
                            const newLine = {
                                type: "paragraph",
                                children: [
                                    {
                                        text: "",
                                        marks: []
                                    }
                                ]
                            };
                            Transforms.insertNodes(editor, newLine);
                            return;
                        }

                        else if (key === "Enter" && event.shiftKey) {
                            event.preventDefault();
                            Transforms.insertText(editor, "\n");
                            return;
                        }

                        // remove last list-type if value empty and insert new paragraph
                        else if (key === "Enter") {
                            const {selection} = editor;

                            const [match] = Editor.nodes(editor, {
                                match: n => LIST_TYPES.includes(n.type),
                                at: Editor.before(editor, selection.focus, {unit: "block"})
                            });
                            if (match) {
                                const lastMatchChild = match[0].children[match[0].children.length - 1];
                                if (lastMatchChild.children.length === 1 && lastMatchChild.children[0].text === "") {
                                    event.preventDefault();
                                    toggleBlock(editor, match.type);
                                    return;
                                }

                            }
                        }

                        else if (ARROW_KEYS.includes(key)) {
                            const {selection} = editor;
                            const [match] = Editor.nodes(editor, {
                                match: n => n.type === 'image',
                                at: Editor[`${BACKWARD_KEYS.includes(key) ? "before" : "after"}`](editor, selection.focus, {unit: "block"})
                            });
                            if (match) {
                                event.preventDefault();
                                Transforms.move(editor, {reverse: BACKWARD_KEYS.includes(key), distance: 2, unit: "character"});
                                return;
                            }
                        }

                        else if (event.key === "Backspace" || event.key === "Delete") {
                            const {selection} = editor;
                            const [match] = Editor.nodes(editor, {
                                match: n => n.type === 'image',
                                at: Editor.before(editor, selection.focus, {unit: "block"})
                            });
                            const [curMatch] = Editor.nodes(editor, {
                                match: n => n.type !== 'image',
                                at: selection.focus
                            });
                            if (match && curMatch) {
                                event.preventDefault();
                                Transforms.move(editor, {reverse: true, distance: 1, unit: "character"});
                                return;
                            }
                        }
                    }}
                />
            </Slate>
        </div>
    );
};


ReactDOM.render(
    <NeoGrpEditor api={window.CONFIG.api} />,
    document.getElementById('editor-wrapper')
);
