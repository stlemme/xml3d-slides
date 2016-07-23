(function () {
    // This promise resolves when everything is loaded, converted and rendered
    var c_resolveComplete;
    var c_base_component_path = "./templates/";
    var c_dataComponents = ["x3d-appearance", "x3d-material"];

    window.X3DOMtoDec3D = {};
    window.X3DOMtoDec3D.conversionComplete = new Promise(function(resolve, reject) {
        c_resolveComplete = resolve;
    });

    window.addEventListener("load", function() {
        var requiredComponentNames = {};
        var x3dElems = document.querySelectorAll("x3d *");
        for (var i=0; i < x3dElems.length; i++) {
            requiredComponentNames[x3dElems[i].nodeName.toLowerCase()] = 0;
        }

        Promise.all( loadComponents(requiredComponentNames) ).then(convertX3DScenes);
    });

    function loadComponents(requiredComponentNames) {
        var promises = [];
        for (let comp in requiredComponentNames) {
            let promise = (function() {
                var name = "x3d-"+comp;

                return fetch(c_base_component_path + name + ".html").then(response => {
                    return response.text();
                }).then(text => {
                    var proto;
                    if (c_dataComponents.indexOf(name) !== -1) {
                        proto = Object.create(negative.TemplatedData.prototype);
                    } else {
                        proto = Object.create(negative.TemplatedGroup.prototype);
                    }
                    var div = document.createElement("div");
                    div.innerHTML = text;
                    proto.template = div.querySelector("template");

                    document.registerElement(name, {prototype : proto});
                }).catch(e => {
                    console.warn("Could not find template for component "+name);
                });
            })();
            promises.push(promise);
        }
        return promises;
    }

    function convertX3DScenes() {
        var x3d = document.querySelectorAll("x3d");
        for (var i=0; i < x3d.length; i++) {
            if (x3d[i].hasAttribute("data-src")) {
                console.error("x3dom conversion script does not yet support external x3d scenes ('data-src' attribute)!");
            }
            convertX3DScene(x3d[i]);
        }
    }

    function convertX3DScene(x3d) {
        var web3d = document.createElement("canvas", "w3d-canvas");
        for (let i= 0, atts = x3d.attributes; i < atts.length; i++) {
            web3d.setAttribute(atts[i].nodeName, atts[i].nodeValue);
        }
        var width = x3d.getAttribute("width"), height = x3d.getAttribute("height");
        if (width || height) {
            var style = web3d.getAttribute("style") || "";
            web3d.setAttribute("style", "width: "+width+"; height: "+height+";"+style);
        }

        insertCamera(web3d);

        var children = x3d.childNodes;
        for (var i=0; i < children.length; i++) {
            if (children[i].nodeType !== Node.ELEMENT_NODE) {
                web3d.appendChild(children[i].cloneNode());
                continue;
            }
            convertX3DNode(children[i], web3d);
        }
        x3d.parentElement.removeChild(x3d); 
        document.body.appendChild(web3d);
        c_resolveComplete();
    }

    function convertX3DNode(x3dNode, web3dNode) {
        // Copy all attributes from the x3dNode
        var x3dComp = document.createElement("x3d-"+x3dNode.nodeName);
        for (let i= 0, atts = x3dNode.attributes; i < atts.length; i++) {
            x3dComp.setAttribute(atts[i].nodeName, atts[i].nodeValue);
        }
        for (let i = 0, children = x3dNode.childNodes; i < children.length; i++) {
            if (children[i].nodeType !== Node.ELEMENT_NODE) {
                x3dComp.appendChild(children[i].cloneNode());
                continue;
            }
            convertX3DNode(children[i], x3dComp);
        }
        web3dNode.appendChild(x3dComp);
    }

    function insertCamera(root) {
        var cam = document.createElement("sg-perspective-camera");
        cam.setAttribute("fov", 45);
        var cont = document.createElement("trackball-controller");
        cont.appendChild(cam);

        var light = document.createElement("w3d-light");
        light.setAttribute("model", "directional");
        cont.appendChild(light);

        root.appendChild(cont);
    }


})();

