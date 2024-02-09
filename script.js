class Particle {
    constructor (data) {
        this.x = (data.x ?? 0);
        this.y = (data.y ?? 0);
        this.mass =( data.mass ?? 0);
        this.size = (data.size ?? 1);
        this.color = (data.color ?? '#ffffff');
        this.vx = (data.vx ?? 0);
        this.vy = (data.vy ?? 0);
        this.id = (data.id ?? null);
        this.ax = (data.ax ?? 0);
        this.ay = (data.ay ?? 0);
    }
    clearAcceleration() {
        this.ax = 0;
        this.ay = 0;
    }
    updateAcceleration(dtSEC) {
        this.vx += this.ax * dtSEC;
        this.vy += this.ay * dtSEC;
        this.x += this.vx * dtSEC;
        this.y += this.vy * dtSEC;
    }
}

class Simulation {
    constructor (canvas, particleList, settings) {
        this.canvas = canvas;
        this.particleList = particleList;
        this.settings = settings;
        this.openingParticleDiv = [/* particleObj, particleAttrList */];
        this.xdrag = 0;
        this.ydrag = 0;
        this.frameId = null;
        this.simulationRunning = false;    
        this.pauseButtonClicked = false;
    }

    calculateAccelerationStep(dtMS) {
        const distanceRatio = this.settings.dMulMilKm * 1e+9 / this.settings.dMulPx;
        const timeRatio = this.settings.timeStepHr*3600 / this.settings.timeStepSec;
        for (const p of this.particleList) {
            p.clearAcceleration;
        }
        for (let pi1 = 0 ; pi1 < this.particleList.length; pi1++) {
            let p1 = this.particleList[pi1];
            if (p1.mass !== 0) {
                for (let pi2 = pi1+1 ; pi2 < this.particleList.length; pi2++) {
                    let p2 = this.particleList[pi2];
                    const x1 = p1.x;
                    const y1 = p1.y;
                    const x2 = p2.x;
                    const y2 = p2.y;
                    const dx = x2-x1;
                    const dy = y2-y1;
                    let distance = Math.sqrt((dx*dx)+(dy*dy));
                    distance =
                        (distance * distanceRatio < this.settings.dMin) ?
                            this.settings.dMin
                            : distance * distanceRatio;
                    const F = (p1.mass * p2.mass)/distance;
                    let Fx = (F * ((dx)/distance));
                    Fx = isNaN(Fx) ? 0 : Fx;
                    let Fy = (F * ((dy)/distance));
                    Fy = isNaN(Fy) ? 0 : Fy;
                    p1.ax += Fx;
                    p1.ay += Fy;
                    p2.ax -= Fx;
                    p2.ay -= Fy;
                }
                p1.ax *= this.settings.G / p1.mass;
                p1.ay *= this.settings.G / p1.mass;

                if (p1.ax > this.settings.aLim)
                    p1.ax = this.settings.aLim;

                if (p1.ay > this.settings.aLim)
                    p1.ay = this.settings.aLim;

                p1.ax /= distanceRatio;
                p1.ay /= distanceRatio;
            }
        }
        for (const p of this.particleList) {
            p.updateAcceleration(dtMS*0.001 * timeRatio);
        }
    }

    renderStep() {
        const ctx = this.canvas.getContext('2d');
        const width = this.canvas.width;
        const height = this.canvas.height;
        const renderCeil = this.settings.renderCeil;
        const zoom = this.settings.zoom;
        const xdrag = this.xdrag;
        const ydrag = this.ydrag;
        let size, x, y;
        ctx.clearRect(0, 0, width, height);

        for (const p of this.particleList) {
            size = p.size * zoom;
            x = (p.x + xdrag) * zoom + width * 0.5 - size * 0.5;
            y = (p.y + ydrag) * zoom + height * 0.5 - size * 0.5;

            ctx.fillStyle = p.color;
            if (renderCeil) {
                ctx.fillRect(Math.ceil(x), Math.ceil(y), Math.ceil(size), Math.ceil(size));
            }
            else {
                ctx.fillRect(x, y, size, size);
            }
        }
    }

    animate(simulationObj, lastTime) {
        if (!simulationObj.pauseButtonClicked) {
            const dtMS = performance.now() - lastTime;
            lastTime = performance.now();
            simulationObj.calculateAccelerationStep(dtMS);
            simulationObj.renderStep();

            for (const entry of this.openingParticleDiv) {
                const p = entry[0];
                const attrList = entry[1];
                for (const pair of attrList) {
                    pair[1].nodeValue = p[pair[0]];
                }
            }

            requestAnimationFrame(function() {
                simulationObj.animate(simulationObj, lastTime);
            });
        }
        else {
            if (simulationObj.pauseButtonClicked) {
                simulationObj.pauseButtonClicked = false;
                cancelAnimationFrame(simulationObj.frameId);
                simulationObj.frameId = null;
            }
            simulationObj.pauseButtonClicked = false;
            this.simulationRunning = false;
        }
    }

    start() {
        if (!this.simulationRunning) {
            this.simulationRunning = true;
            this.frameId = this.animate(this, performance.now());
        }
    }

    resetVelocity() {
        for (let p of this.particleList) {
            p.vx = 0;
            p.vy = 0;
        }
    }

    pause() {
        if (this.simulationRunning) {
            this.pauseButtonClicked = true;
        }
    }

    end() {
        const ctx = this.canvas.getContext('2d');
        const width = this.canvas.width;
        const height = this.canvas.height;
        const particleListDiv = document.getElementById('particleList');
        [...particleListDiv.childNodes].forEach((node) => {
            if (node.nodeType == 1) {
                particleListDiv.removeChild(node);
            }
        });
        this.openingParticleDiv = [];
        this.particleList = [];
        this.renderStep();
        if (this.simulationRunning) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
            this.pause();
        }
    }
}

const defaultTemplates = [
    {
        templateName: "Solar system",
        particleList: [
            {
                x: 0,
                y: 0,
                mass: 1,
                size: 10,
                color: "#ffffff",
                vx: 0,
                vy: 0,
                id: "the SUNNN",
                ax: 0,
                ay: 0,
            }
        ],
    },
];

window.addEventListener('load', () => {
    let dragState = false;
    let lastXDrag = null;
    let lastYDrag = null;
    const particleListDiv = document.getElementById('particleList');
    const applySettingsButton = document.getElementById('applySettings');
    const zoomInput = document.getElementById('zoom');
    const menuButtons = Object.fromEntries(
        [...document.getElementById('menu').getElementsByTagName('img')].filter(
            (e) => (e.hasAttribute('data-popup'))
        ).map(
            (e) => [e.getAttribute('data-popup'), e]
        )
    );
    const canvas = document.getElementById('canvas');
    const insertInputs = Object.fromEntries(
        [
            ...[...document.querySelector('.popups').children].find(
                (e) => (e.hasAttribute('data-popup') && e.getAttribute('data-popup') === 'insert')
            )?.getElementsByTagName('input')
        ].map(
            (e) => [e.getAttribute('id'), e]
        )
    );

    const simulation = new Simulation(
        canvas,
        [],
        Object.assign(
            Object.fromEntries(
                [...applySettingsButton.parentNode.getElementsByTagName('input')].filter(
                    (e) => (e.hasAttribute('type') && e.hasAttribute('id'))
                ).map(
                    (e) => {
                        if (e.getAttribute('type') === 'number') {
                            return [e.getAttribute('id'), isNaN(parseInt(e.value)) ? parseFloat(e.getAttribute('placeholder')) : parseFloat(e.value)];
                        }
                        else if (e.getAttribute('type') ==='checkbox') {
                            return [e.getAttribute('id'), e.checked];
                        }
                    }
                )
            ),
            {
                zoom: (
                    isNaN(parseFloat(zoomInput.value)) ?
                            parseFloat(zoomInput.placeholder) * 0.01
                        :
                            (
                                parseFloat(zoomInput.value) > 0 ?
                                    parseFloat(zoomInput.value) * 0.01
                                :
                                    parseFloat(zoomInput.placeholder) * 0.01
                            )
                )
            }
        )
    );

    window.simulation = simulation;
    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        simulation.renderStep();
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Apply button
    applySettingsButton.addEventListener('click', (event) => {
        event.preventDefault();
        simulation.settings = Object.fromEntries(
            [...applySettingsButton.parentNode.getElementsByTagName('input')].filter(
                (e) => (e.hasAttribute('type') && e.hasAttribute('id'))
            ).map(
                (e) => {
                    if (e.getAttribute('type') === 'number') {
                        if (e.getAttribute('id') === 'dMulMilKm') {
                            simulation.particleList.forEach((p) => {
                                const newDistanceRatio = (simulation.settings.dMulMilKm/(isNaN(parseInt(e.value)) ? parseFloat(e.getAttribute('placeholder')) : parseFloat(e.value)));
                                p.vx *= newDistanceRatio;
                                p.vy *= newDistanceRatio;
                            });
                        }
                        else if (e.getAttribute('id') === 'dMulPx') {
                            simulation.particleList.forEach((p) => {
                                const newDistanceRatio = (simulation.settings.dMulPx/(isNaN(parseInt(e.value)) ? parseFloat(e.getAttribute('placeholder')) : parseFloat(e.value)));
                                p.vx *= newDistanceRatio;
                                p.vy *= newDistanceRatio;
                            });
                        }
                        return [e.getAttribute('id'), isNaN(parseInt(e.value)) ? parseFloat(e.getAttribute('placeholder')) : parseFloat(e.value)];
                    }
                    else if (e.getAttribute('type') ==='checkbox') {
                        return [e.getAttribute('id'), e.checked];
                    }
                }
            )
        );
        simulation.settings["zoom"] = 
            isNaN(parseFloat(zoomInput.value)) ?
                parseFloat(zoomInput.placeholder) * 0.01
            :
                (
                    parseFloat(zoomInput.value) > 0 ?
                        parseFloat(zoomInput.value) * 0.01
                    :
                        parseFloat(zoomInput.placeholder) * 0.01
                );
        simulation.renderStep();
    });

    zoomInput.addEventListener('input', () => {
        simulation.settings["zoom"] = 
            isNaN(parseFloat(zoomInput.value)) ?
                parseFloat(zoomInput.placeholder) * 0.01
            :
                (
                    parseFloat(zoomInput.value) > 0 ?
                        parseFloat(zoomInput.value) * 0.01
                    :
                        parseFloat(zoomInput.placeholder) * 0.01
                );
        simulation.renderStep();
    });

    (() => {
        const popupsDescentants = [...document.getElementsByClassName('popups')[0].getElementsByTagName('div')];
        const popup_list = popupsDescentants.find(
            (e) => (e.hasAttribute('data-popup') && e.getAttribute('data-popup') === 'list')
        );
        const popup_template = popupsDescentants.find(
            (e) => (e.hasAttribute('data-popup') && e.getAttribute('data-popup') === 'template')
        );
        const popup_templateExport = popupsDescentants.find(
            (e) => (e.hasAttribute('data-popup') && e.getAttribute('data-popup') === 'templateExport')
        )
        ;const popup_templateImport = popupsDescentants.find(
            (e) => (e.hasAttribute('data-popup') && e.getAttribute('data-popup') === 'templateImport')
        );
        const templateList = document.getElementById('templateList');
        const templateInput = document.getElementById('templateInput');
        const saveTemplateButton = document.getElementById('saveTemplateButton');
        const exportTemplateButton = document.getElementById('exportTemplateButton');
        const templateExportTextArea = document.getElementById('templateExportTextArea');
        const defaultTemplateList = document.getElementById('defaultTemplateList');
        const templateImportTextArea = document.getElementById('templateImportTextArea');
        const confirmImport = document.getElementById('confirmImport');

        function showExport(text) {
            templateExportTextArea.value = text;

            popup_templateExport.style.display = 'block';
            popup_template.removeAttribute('style');
        }

        function loadDefaultTemplate(template, parent) {
            const element = parent.appendChild(document.createElement("div"));
            void element.appendChild(
                document.createElement("span")
                .appendChild(document.createTextNode(`${template.templateName} (${template.particleList.length} Particles)`))
                .parentNode
            );
            const loadButton = element.appendChild(
                document.createElement("button")
                .appendChild(document.createTextNode('Load'))
                .parentNode
            );
            loadButton.addEventListener('click', () => {
                template.particleList.forEach((preP) => {
                    const prePcopy = {};
                    Object.entries(preP).forEach((pair) => {
                        prePcopy[pair[0]] = pair[1]
                    })
                    for (const p of simulation.particleList) {
                        if (p.id === prePcopy.id) {
                            prePcopy.id = `${prePcopy.id}#`;
                        }
                    }
                    const P = new Particle(prePcopy);
                    createParticleDivChild(P);
                    simulation.particleList.push(P);
                });
                simulation.renderStep();
            });
            return element
        }

        function loadTemplate(template, parent) {
            const element = loadDefaultTemplate(template, parent);
            const exportButton = element.appendChild(
                document.createElement('button')
                .appendChild(document.createTextNode('Export as JSON'))
                .parentNode
            );
            const deleteButton = element.appendChild(
                document.createElement('button')
                .appendChild(document.createTextNode('Delete'))
                .parentNode
            );
            exportButton.addEventListener('click', () => showExport(JSON.stringify(template)));
            deleteButton.addEventListener('click', () => {
                try {
                    const templates = JSON.parse(localStorage.getItem('templates'));
                    for (const i in templates) {
                        if (templates[i].templateName === template.templateName) {
                            templates.splice(i, 1);
                            break;
                        }
                    }
                    element.remove();
                    localStorage.setItem('templates', JSON.stringify(templates));
                }
                catch (err) {
                    alert(`An error occured: ${err.name} ${err.cause} ${err.message}`);
                }
            });
            void element.appendChild(document.createElement('hr'));
        }

        document.getElementById('toTemplateButton').addEventListener('click', () => {
            popup_list.removeAttribute('style');
            popup_template.style.display = 'block';
        });
    
        document.getElementById('templateGoBackButton').addEventListener('click', () => {
            popup_list.style.display = 'block';
            popup_template.removeAttribute('style');
        });

        document.getElementById('templateExportGoBackButton').addEventListener('click', () => {
            popup_template.style.display = 'block';
            popup_templateExport.removeAttribute('style');
        });

        document.getElementById('importTemplateButton').addEventListener(('click'), () => {
            popup_templateImport.style.display = 'block';
            popup_template.removeAttribute('style');
        });

        document.getElementById('templateImportGoBackButton').addEventListener(('click'), () => {
            popup_template.style.display = 'block';
            popup_templateImport.removeAttribute('style');

        });

        /*
        defaultTemplates = [
            {
                templateName: "Solar system",
                particleList: [
                    {
                        x: 0,
                        y: 0,
                        mass: 1,
                        size: 10,
                        color: "#ffffff",
                        vx: 0,
                        vy: 0,
                        id: "the SUNNN",
                        ax: 0,
                        ay: 0,
                    }
                ],
            },
        ];
        */

        saveTemplateButton.addEventListener('click', () => {
            try {
                const particleList = simulation.particleList;
                if (particleList != 0) {
                    const templates = JSON.parse(localStorage.getItem('templates'));

                    const template = {
                        templateName: (!(/\S/.test(templateInput.value)))
                        ? templateInput.getAttribute('placeholder')
                        : templateInput.value,
                        particleList: particleList
                    };

                    if (templates == null) {
                        localStorage.setItem('templates', JSON.stringify([template]));
                    }
                    else {
                        for (const t of templates) {
                            if (t.templateName === template.templateName) {
                                template.templateName = `${template.templateName}#`;
                            }
                        }
                        templates.push(template);
                        localStorage.setItem('templates', JSON.stringify(templates));
                    }
                    loadTemplate(template, templateList);
                }
                else {
                    alert("Can't save template with no particles")
                }
            }
            catch (err) {
                alert(`An error occured: ${err.name} ${err.cause} ${err.message}`);
            }
        });

        exportTemplateButton.addEventListener('click', () => {
            const particleList = simulation.particleList;

            const template = {
                templateName: (!(/\S/.test(templateInput.value)))
                ? templateInput.getAttribute('placeholder')
                : templateInput.value,
                particleList: particleList
            };

            showExport(JSON.stringify(template));
        });

        confirmImport.addEventListener(('click'), () => {
            try {
                if (/\S/.test(templateImportTextArea.value)) {
                    const templates = JSON.parse(localStorage.getItem('templates'));
                    const template = JSON.parse(templateImportTextArea.value);

                    if (template.templateName && template.particleList) {
                        if (templates == null) {
                            localStorage.setItem('templates', JSON.stringify([template]));
                        }
    
                        else {
                            for (const t of templates) {
                                if (t.templateName === template.templateName) {
                                    template.templateName = `${template.templateName}#`;
                                }
                            }
                            templates.push(template);
                            localStorage.setItem('templates', JSON.stringify(templates));
                        }
                    }
                    else {
                        alert('JSON is not valid')
                    }

                    loadTemplate(template, templateList);
                }
                else {
                    alert("Can't save empty template")
                }

                popup_template.style.display = 'block';
                popup_templateImport.removeAttribute('style');
            }
            catch (err) {
                alert(`An error occured: ${err.name} ${err.cause} ${err.message}`);
            }
        });
        
        defaultTemplates.forEach((template) => {
            void loadDefaultTemplate(template, defaultTemplateList).appendChild(document.createElement('hr'));
        });

        try {
            JSON.parse(localStorage.getItem('templates'))?.forEach((template) => {
                loadTemplate(template, templateList);
            });
        }
        catch (err) {
            alert(`An error occured: ${err.name} ${err.cause} ${err.message}`);
        }
    })();

    function createParticleDivChild(particle) {
        if (particle.id != null) {
            const element = particleListDiv.appendChild(document.createElement("div"));
            const title = element.appendChild(
                document.createElement("span")
                .appendChild(document.createTextNode(`▶ ${particle.id}`))
                .parentNode
            );
            const deleteButton = element.appendChild(
                document.createElement('button')
                .appendChild(document.createTextNode('Delete'))
                .parentNode
            );
            const content = element.appendChild(document.createElement("table"));
            const attributes = [
                'x', 'y', 'mass', 'size', 'color', 'vx', 'vy', 'ax', 'ay'
            ].map(str => {
                const e = document.createElement('tr');
                const textNode = document.createTextNode(particle[str]);
                void e.appendChild(document.createElement('td').appendChild(document.createTextNode(str)).parentNode);
                void e.appendChild(document.createElement('td').appendChild(textNode).parentNode);
                void content.appendChild(e);
                return [str, textNode];
            });
            content.style.display = 'none';
            content.classList.add('particle-content');
            title.classList.add('pointer')
            title.checked = false;
            title.addEventListener('click', () => {
                if (title.checked) {
                    for (const i in simulation.openingParticleDiv) {
                        if (simulation.openingParticleDiv[i][0] == particle) {
                            simulation.openingParticleDiv.splice(i, 1);
                            break;
                        }
                    }
                    title.checked = false;
                    title.firstChild.nodeValue = `▶ ${particle.id}`;
                    content.style.display = "none";
                }
                else {
                    simulation.openingParticleDiv.push([particle, attributes]);
                    title.checked = true;
                    attributes.forEach(pair => {
                        const node = [...pair[1].childNodes].find(node => {
                            return (node.nodeType == 3)
                        }) 
                        if (node != null) {
                            node.nodeValue = `${pair[0]}, ${particle[pair[0]]}`
                        };
                    });
                    title.firstChild.nodeValue = `▼ ${particle.id}`;
                    content.style.display = "block";
                }
            });
            deleteButton.addEventListener('click', () => {
                const index = simulation.particleList.indexOf(particle)
                if (index != -1) {
                    simulation.particleList.splice(index, 1);
                }
                element.remove();
                simulation.renderStep();
            });
            element.appendChild(document.createElement('hr'));
        }
    }

    function getGenerateData() {
        const particlesAmount = isNaN(parseInt(insertInputs.particlesAmount.value)) ? insertInputs.particlesAmount.placeholder : parseInt(insertInputs.particlesAmount.value);
        const mass = isNaN(parseFloat(insertInputs.mass.value)) ? parseFloat(insertInputs.mass.placeholder) : parseFloat(insertInputs.mass.value);
        const size = isNaN(parseInt(insertInputs.size.value)) ? parseInt(insertInputs.size.placeholder) : parseInt(insertInputs.size.value);
        const color = insertInputs.color.value ? insertInputs.color.value : insertInputs.color.placeholder;
        const vx = isNaN(parseFloat(insertInputs.xvelocity.value)) ? parseFloat(insertInputs.xvelocity.placeholder) : parseFloat(insertInputs.xvelocity.value);
        const vy = isNaN(parseFloat(insertInputs.yvelocity.value)) ? parseFloat(insertInputs.yvelocity.placeholder) : parseFloat(insertInputs.yvelocity.value);
        const id = insertInputs.idName.value ? insertInputs.idName.value : null;
        const x = isNaN(parseFloat(insertInputs.x.value)) ? parseFloat(insertInputs.x.placeholder) : parseFloat(insertInputs.x.value);
        const y = isNaN(parseFloat(insertInputs.y.value)) ? parseFloat(insertInputs.y.placeholder) : parseFloat(insertInputs.y.value);
        return {
            particlesAmount: particlesAmount,
            mass: mass,
            size: size,
            color: color,
            vx: vx,
            vy: vy,
            id: id,
            x: x,
            y: y
        };
    }

    function dragDown(event, touch=false) {
        touch && event.preventDefault();
        if (menuButtons.drag.getAttribute('data-checked') === 'true') {
            dragState = true;
        }
        else if (insertInputs.generateOnTouch.checked) {
            const generateData = getGenerateData();
            const zoom = simulation.settings.zoom;

            const cx = (touch ? event.changedTouches[0].clientX : event.clientX);
            const cy = (touch ? event.changedTouches[0].clientY : event.clientY);
            const calculatedX = (cx-(simulation.xdrag*zoom)-(simulation.canvas.width*0.5))/zoom;
            const calculatedY = (cy-(simulation.ydrag*zoom)-(simulation.canvas.height*0.5))/zoom;

            const distanceRatio = simulation.settings.dMulPx / (simulation.settings.dMulMilKm * 1e+9);
            const vx = generateData.vx * distanceRatio;
            const vy = generateData.vy * distanceRatio;

            let id = generateData.id;

            for (const p of simulation.particleList) {
                if (p.id === id) {
                    id = `${id}#`;
                }
            }

            const particle = new Particle(
                {
                    x: calculatedX,
                    y: calculatedY,
                    mass: generateData.mass,
                    size: generateData.size,
                    color: generateData.color,
                    vx: vx,
                    vy: vy,
                    id: id
                }
            );

            createParticleDivChild(particle);
            simulation.particleList.push(particle);
            simulation.renderStep();
        }
    }

    function dragMove(event, touch=false) {
        if (dragState) {
            const zoom = simulation.settings.zoom; 
            let dx, dy;

            if (touch) {
                const clientX = (touch ? event.changedTouches[0].clientX : event.clientX);
                const clientY = (touch ? event.changedTouches[0].clientY : event.clientY);
                if (lastXDrag == null) {
                    lastXDrag = clientX;
                    dx = 0
                }
                else {
                    dx = clientX - lastXDrag;
                    dx /= zoom 
                    lastXDrag = clientX;
                }
                if (lastYDrag == null) {
                    lastYDrag = clientY;
                    dy = 0
                }
                else {
                    dy = clientY - lastYDrag; 
                    dy /= zoom;
                    lastYDrag = clientY;
                }
            }

            else {
                event.preventDefault();
                if (lastXDrag == null) {
                    lastXDrag = event.clientX;
                    dx = 0
                }
                else {
                    dx = event.clientX - lastXDrag;
                    dx /= zoom 
                    lastXDrag = event.clientX;
                }
                if (lastYDrag == null) {
                    lastYDrag = event.clientY;
                    dy = 0
                }
                else {
                    dy = event.clientY - lastYDrag; 
                    dy /= zoom;
                    lastYDrag = event.clientY;
                }
            }

            simulation.xdrag += dx;
            simulation.ydrag += dy;
            simulation.renderStep();
        }
    }

    function dragUp(event, touch=false) {
        if (dragState) {
            dragState = false;
            lastXDrag = null;
            lastYDrag = null;
            simulation.renderStep();
        }
    }

    canvas.addEventListener('mousedown', (event) => {dragDown(event, false)});
    // Uses body instead up canvas to detect more
    document.querySelector('body').addEventListener('mousemove', (event) => {dragMove(event, false)});
    document.querySelector('body').addEventListener('mouseup', (event) => {dragUp(event, false)});
    
    canvas.addEventListener('touchstart', (event) => {dragDown(event, true)});
    document.querySelector('body').addEventListener('touchmove', (event) => {dragMove(event, true)});
    document.querySelector('body').addEventListener('touchend', (event) => {dragUp(event, true)});
    document.querySelector('body').addEventListener('touchcancel', (event) => {dragUp(event, true)});

    document.getElementById('generateAllOverScreen').addEventListener('click', (event) => {
        event.preventDefault();
        const randomizedParticleList = [];
        const generateData = getGenerateData();
        const zoom = simulation.settings.zoom;

        const width = simulation.canvas.width/zoom;
        const halfWidth = width*0.5 + simulation.xdrag;
        const height = simulation.canvas.height/zoom;
        const halfHeight = height*0.5 + simulation.ydrag;

        const distanceRatio = simulation.settings.dMulPx / (simulation.settings.dMulMilKm * 1e+9);
        const vx = generateData.vx * distanceRatio;
        const vy = generateData.vy * distanceRatio;

        if (!isNaN(generateData.particlesAmount)) {
            for (let i = 0; i < generateData.particlesAmount; i++) {
                randomizedParticleList.push(
                    new Particle(
                        {
                            x: Math.random()*width - halfWidth,
                            y: Math.random()*height - halfHeight,
                            mass: generateData.mass,
                            size: generateData.size,
                            color: generateData.color,
                            vx: vx,
                            vy: vy
                        }
                    )
                );
            }

            simulation.particleList = simulation.particleList.concat(randomizedParticleList);
            simulation.renderStep();
        }
    });

    document.getElementById('generateDesiredPosition').addEventListener('click', (event) => {
        event.preventDefault();
        const generateData = getGenerateData();
        const distanceRatio = simulation.settings.dMulPx / (simulation.settings.dMulMilKm * 1e+9);
        const vx = generateData.vx * distanceRatio;
        const vy = generateData.vy * distanceRatio;
        let id = generateData.id;

        for (const p of simulation.particleList) {
            if (p.id === id) {
                id = `${id}#`;
            }
        }

        const particle = new Particle(
            {
                x: generateData.x,
                y: generateData.y,
                mass: generateData.mass,
                size: generateData.size,
                color: generateData.color,
                vx: vx,
                vy: vy,
                id: id
            }
        );

        createParticleDivChild(particle);
        simulation.particleList.push(particle);
        simulation.renderStep();
    });

    menuButtons['drag'].parentNode.addEventListener('click', (event) => {
        event.preventDefault();
        if (menuButtons['drag'].getAttribute('data-checked') === 'false'){
            menuButtons['drag'].setAttribute('src', 'svgs/drag-on.svg');
            menuButtons['drag'].setAttribute('data-checked', 'true');
        }
        else {
            menuButtons['drag'].setAttribute('src', 'svgs/drag-off.svg');
            menuButtons['drag'].setAttribute('data-checked', 'false');
        }
    });

    menuButtons['reset'].parentNode.addEventListener('click', (event) => {
        event.preventDefault();
        simulation.resetVelocity();
    });

    menuButtons['play'].parentNode.addEventListener('click', (event) => {
        event.preventDefault();
        menuButtons['play'].parentNode.parentNode.parentNode.style.display = "none";
        menuButtons['pause'].parentNode.parentNode.parentNode.style.display = "inline";
        simulation.start();
    });
    menuButtons['pause'].parentNode.addEventListener('click', (event) => {
        event.preventDefault();
        menuButtons['pause'].parentNode.parentNode.parentNode.style.display = "none";
        menuButtons['play'].parentNode.parentNode.parentNode.style.display = "inline";
        simulation.pause();
    });

    menuButtons['end'].parentNode.addEventListener('click', (event) => {
        event.preventDefault();
        if (getComputedStyle(menuButtons['pause'].parentNode.parentNode.parentNode).display !== 'none') {
            menuButtons['pause'].parentNode.parentNode.parentNode.style.display = "none";
            menuButtons['play'].parentNode.parentNode.parentNode.style.display = "inline";
        }
        simulation.end();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && simulation.simulationRunning) {
            menuButtons['pause'].click();
        }
    });
});