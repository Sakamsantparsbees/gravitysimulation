class Particle {
    constructor (x, y, mass, size, color, vx, vy, id=null) {
        this.x = x;
        this.y = y;
        this.mass = mass;
        this.size = size;
        this.color = color;
        this.vx = vx;
        this.vy = vy;
        this.id = id;
        this.ax = 0;
        this.ay = 0;
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
        this.frameId = null;
        this.simulationRunning = false;    
        this.pauseButtonClicked = false;
    }

    draw(ctx, particle, width, height, renderCeil) {
        const size = particle.size;
        ctx.fillStyle = particle.color;
        ctx.fillRect(
            (renderCeil) ? Math.ceil(particle.x + width / 2 - size / 2) : particle.x + width / 2 - size / 2,
            (renderCeil) ? Math.ceil(particle.y + height / 2 - size / 2) : particle.y + height / 2 - size / 2 ,
            size, size
        );
    }

    calculateAccelerationStep(dtMS) {
        const distanceRatio = this.settings.dMulMilKm * 1e+9 / this.settings.dMulPx;
        const timeRatio = this.settings.timeStepHr*3600 / this.settings.timeStepSec;
        for (let p of this.particleList) {
            p.clearAcceleration;
        }
        for (let pi1 = 0 ; pi1 < this.particleList.length; pi1++) {
            let p1 = this.particleList[pi1];
            for (let pi2 = pi1+1 ; pi2 < this.particleList.length; pi2++) {
                let p2 = this.particleList[pi2];
                const x1 = p1.x;
                const y1 = p1.y;
                const x2 = p2.x;
                const y2 = p2.y;
                const dx = x2-x1;
                const dy = y2-y1;
                const distance =
                    (Math.sqrt((dx*dx)+(dy*dy)) * distanceRatio < this.settings.dMin) ?
                        this.settings.dMin
                        : Math.sqrt((dx*dx)+(dy*dy)) * distanceRatio;
                const F = (p1.mass * p2.mass)/distance;
                const Fx = F * ((dx)/distance);
                const Fy = F * ((dy)/distance);
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
        for (let p of this.particleList) {
            p.updateAcceleration(dtMS*0.001 * timeRatio);
        }
    }

    renderStep() {
        const ctx = this.canvas.getContext('2d');
        const width = this.canvas.width;
        const height = this.canvas.height;
        ctx.clearRect(0, 0, width, height);
        for (let p of this.particleList) {
            this.draw(ctx, p, width, height, this.settings.renderCeil);
        }
    }

    animate(simulationObj, lastTime) {
        if (!simulationObj.pauseButtonClicked) {
            const dtMS = performance.now() - lastTime;
            lastTime = performance.now();
            simulationObj.calculateAccelerationStep(dtMS);
            simulationObj.renderStep();

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
        ctx.clearRect(0, 0, width, height);
        this.particleList = [];
        this.renderStep();
        if (this.simulationRunning) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
            this.pause();
        }
    }
}


window.addEventListener('load', () => {
    const applySettingsButton = document.querySelector('#applySettings');
    const menuButtons = Object.fromEntries(
        [...document.querySelector('#menu').getElementsByTagName('img')].filter(
            (e) => (e.hasAttribute('data-popup'))
        ).map(
            (e) => [e.getAttribute('data-popup'), e]
        )
    );
    const canvas = document.querySelector('#canvas');
    const insertInputs = Object.fromEntries(
        [
            ...[...document.querySelector('#popups').children].find(
                (e) => (e.hasAttribute('data-popup') && e.getAttribute('data-popup') === 'insert')
            )?.getElementsByTagName('input')
        ].map(
            (e) => [e.getAttribute('id'), e]
        )
    );

    const simulation = new Simulation(
        canvas,
        [],
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
        )
    );
    
    // Apply button
    applySettingsButton.addEventListener('click', () => {
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
        simulation.renderStep();
    });

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        simulation.renderStep();
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    function getGenerateData() {
        const particlesAmount = isNaN(parseInt(insertInputs.particlesAmount.value)) ? insertInputs.particlesAmount.placeholder : parseInt(insertInputs.particlesAmount.value);
        const mass = isNaN(parseFloat(insertInputs.mass.value)) ? parseFloat(insertInputs.mass.placeholder) : parseFloat(insertInputs.mass.value);
        const size = isNaN(parseInt(insertInputs.size.value)) ? parseInt(insertInputs.size.placeholder) : parseInt(insertInputs.size.value);
        const color = insertInputs.color.value ? insertInputs.color.placeholder : insertInputs.color.value;
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

    document.querySelector('#generateAllOverScreen').addEventListener('click', () => {
        const randomizedParticleList = [];
        const generateData = getGenerateData();

        const width = simulation.canvas.width;
        const halfWidth = width*0.5;
        const height = simulation.canvas.height;
        const halfHeight = height*0.5;

        const distanceRatio = simulation.settings.dMulPx / (simulation.settings.dMulMilKm * 1e+9);
        const vx = generateData.vx * distanceRatio;
        const vy = generateData.vy * distanceRatio;

        if (!isNaN(generateData.particlesAmount)) {
            for (let i = 0; i < generateData.particlesAmount; i++) {
                randomizedParticleList.push(
                    new Particle(
                        Math.random()*width - halfWidth,
                        Math.random()*height - halfHeight,
                        generateData.mass,
                        generateData.size,
                        generateData.color,
                        vx,
                        vy
                    )
                );
            }

            simulation.particleList = simulation.particleList.concat(randomizedParticleList);
            simulation.renderStep();
        }
    });

    document.querySelector('#generateDesiredPosition').addEventListener('click', () => {
        const generateData = getGenerateData();
        const distanceRatio = simulation.settings.dMulPx / (simulation.settings.dMulMilKm * 1e+9);
        const vx = generateData.vx * distanceRatio;
        const vy = generateData.vy * distanceRatio;

        const particle = new Particle(
            generateData.x, generateData.y, generateData.mass,
            generateData.size, generateData.color,
            vx,
            vy,
            generateData.id
        );

        simulation.particleList = simulation.particleList.concat(particle);
        simulation.renderStep();
    });

    menuButtons['reset'].addEventListener('click', () => {
        simulation.resetVelocity();
    });

    menuButtons['play'].addEventListener('click', () => {
        menuButtons['play'].parentNode.parentNode.style.display = "none";
        menuButtons['pause'].parentNode.parentNode.style.display = "inline-block";
        simulation.start();
    });
    menuButtons['pause'].addEventListener('click', () => {
        menuButtons['pause'].parentNode.parentNode.style.display = "none";
        menuButtons['play'].parentNode.parentNode.style.display = "inline-block";
        simulation.pause();
    });

    menuButtons['end'].addEventListener('click', () => {
        if (getComputedStyle(menuButtons['pause'].parentNode.parentNode).display !== 'none') {
            menuButtons['pause'].parentNode.parentNode.style.display = "none";
            menuButtons['play'].parentNode.parentNode.style.display = "inline-block";
        }
        simulation.end();
    });

    document.addEventListener("visibilitychange", () => {
        if (document.hidden && simulation.simulationRunning) {
            menuButtons['pause'].click();
        }
    });
});