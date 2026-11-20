// O motor comum dos modelos do Estúdio de Vídeos (19/11/2026).
//
// Cada modelo (pasta irmã) é um HTML com as cenas escritas e os ids fixos;
// este arquivo dá a ele: os dados do pedido (`E.d`, lidos do bloco JSON
// `#dados`), o preenchimento dos textos (sempre `textContent`, nunca HTML), a
// câmera com profundidade nas fotos (WebGL) e as animações que se repetem.
// Tudo o que aparece é função do tempo da linha do tempo: nada de relógio,
// sorteio ou rede.
(function () {
  const d = JSON.parse(document.getElementById("dados").textContent);
  const el = (id) => document.getElementById(id);
  const E = { d, el };

  document.documentElement.style.setProperty("--cor", d.cor);

  /** Põe o texto; sem texto, o elemento some. */
  E.texto = (id, texto) => {
    const alvo = el(id);
    if (!alvo) return false;
    alvo.textContent = texto || "";
    alvo.classList.toggle("oculto", !texto);
    return Boolean(texto);
  };

  const pedaco = (texto, classe) => {
    const s = document.createElement("span");
    s.className = classe;
    s.textContent = texto;
    return s;
  };

  /**
   * Duas linhas: a de cima e a de baixo em destaque. Cada palavra num
   * <span class="p"> para entrar uma a uma. `largura` (px) encolhe a letra
   * para a palavra mais comprida caber (0,5em por letra em caixa alta).
   */
  E.duas = (id, cima, baixo, largura) => {
    const alvo = el(id);
    if (!alvo) return false;
    alvo.textContent = "";
    const linhas = [[cima, "p"], [baixo, "p cor"]].filter(([t]) => t);
    alvo.classList.toggle("oculto", linhas.length === 0);
    linhas.forEach(([texto, classe], i) => {
      if (i > 0) alvo.appendChild(document.createElement("br"));
      String(texto).split(" ").filter(Boolean).forEach((palavra) => alvo.appendChild(pedaco(palavra, classe)));
    });
    if (largura && linhas.length) {
      const maior = Math.max(...linhas.map(([t]) => String(t).length));
      const corpo = parseFloat(getComputedStyle(alvo).fontSize);
      alvo.style.fontSize = Math.min(corpo, Math.floor(largura / (maior * 0.5))) + "px";
    }
    return linhas.length > 0;
  };

  /** Parte o nome do imóvel em duas linhas de tamanho parecido. */
  E.nomeEmDuas = () => {
    const palavras = String(d.nome).split(" ").filter(Boolean);
    if (palavras.length < 2) return [d.nome, ""];
    let melhor = 1, menor = Infinity;
    for (let i = 1; i < palavras.length; i++) {
      const dif = Math.abs(palavras.slice(0, i).join(" ").length - palavras.slice(i).join(" ").length);
      if (dif < menor) { menor = dif; melhor = i; }
    }
    return [palavras.slice(0, melhor).join(" "), palavras.slice(melhor).join(" ")];
  };

  /** Uma linha só, que encolhe para caber na largura. */
  E.linha = (id, texto, largura, fator) => {
    if (!E.texto(id, texto)) return false;
    const alvo = el(id);
    const corpo = parseFloat(getComputedStyle(alvo).fontSize);
    alvo.style.fontSize = Math.min(corpo, Math.floor(largura / (String(texto).length * (fator || 0.5)))) + "px";
    return true;
  };

  /** A logo (numa placa branca, pelo CSS do modelo) ou o nome da imobiliária. */
  E.marca = (id) => {
    const alvo = el(id);
    if (!alvo) return;
    if (!d.temLogo) { alvo.textContent = d.marca; alvo.classList.add("sem-logo"); return; }
    const img = document.createElement("img");
    img.src = "assets/logo.png";
    img.alt = "";
    alvo.appendChild(img);
  };

  /** O preço: "R$ <número> <unidade>", com o número num <b> para contar. */
  E.preco = (id, largura) => {
    const alvo = el(id);
    if (!alvo) return false;
    if (!d.preco) { alvo.classList.add("oculto"); return false; }
    alvo.textContent = "";
    alvo.appendChild(document.createTextNode("R$ "));
    const b = document.createElement("b");
    b.id = id + "-n";
    b.textContent = d.preco.valor;
    alvo.appendChild(b);
    alvo.appendChild(document.createTextNode(" " + d.preco.unidade));
    // Uma linha só: com `largura`, a letra encolhe para o preço caber.
    if (largura) {
      const letras = ("R$ " + d.preco.valor + " " + d.preco.unidade).length;
      alvo.style.whiteSpace = "nowrap";
      alvo.style.fontSize = Math.min(parseFloat(getComputedStyle(alvo).fontSize), Math.floor(largura / (letras * 0.5))) + "px";
    }
    return true;
  };

  /** Os destaques como linhas simples: "2 ou 3 dorms", "74 a 122 m²"... */
  E.destaque = (i) => d.destaques[i] || null;
  E.fraseDoDestaque = (i) => { const x = d.destaques[i]; return x ? [x.grande, x.cor].filter(Boolean).join(" ") : ""; };

  // ------------------------------------------------------------ animações
  E.animar = (tl) => {
    const a = {};
    a.slam = (alvo, t, passo) => tl.fromTo(alvo, { opacity: 0, scale: 2.2, y: 40 }, { opacity: 1, scale: 1, y: 0, duration: 0.16, stagger: passo || 0, ease: "power4.in" }, t);
    a.sobe = (alvo, t, dur) => tl.fromTo(alvo, { opacity: 0, y: 60 }, { opacity: 1, y: 0, duration: dur || 0.35, ease: "power3.out" }, t);
    a.entra = (alvo, t) => tl.fromTo(alvo, { opacity: 0, x: -120 }, { opacity: 1, x: 0, duration: 0.3, ease: "back.out(1.8)" }, t);
    a.some = (alvo, t, dur) => tl.fromTo(alvo, { opacity: 0 }, { opacity: 1, duration: dur || 0.6, ease: "power1.out" }, t);
    a.pop = (alvo, t) => tl.fromTo(alvo, { opacity: 0, scale: 0.5 }, { opacity: 1, scale: 1, duration: 0.35, ease: "back.out(2.2)" }, t);
    a.pulsa = (alvo, t, vezes) => tl.to(alvo, { scale: 1.06, duration: 0.2, yoyo: true, repeat: vezes || 1, ease: "power2.inOut" }, t);
    // texto em 3D: entra girando no espaço e segue virando devagar
    a.t3d = (alvo, t, dur, lado) => {
      tl.fromTo(alvo, { opacity: 0, rotationY: 70 * lado, rotationX: 14, z: -500, x: -160 * lado }, { opacity: 1, rotationY: 22 * lado, rotationX: 6, z: 0, x: 0, duration: 0.55, ease: "power3.out" }, t);
      tl.to(alvo, { rotationY: 6 * lado, rotationX: 2, x: 40 * lado, duration: dur, ease: "sine.inOut" }, t + 0.55);
    };
    // o número do preço conta até o valor
    a.conta = (id, t) => {
      const b = el(id + "-n");
      if (!b || !d.preco) return;
      const fim = parseFloat(String(d.preco.valor).replace(".", "").replace(",", "."));
      const casas = String(d.preco.valor).includes(",") ? String(d.preco.valor).split(",")[1].length : 0;
      const n = { v: fim * 0.7 };
      tl.to(n, { v: fim, duration: 0.7, ease: "power2.out", onUpdate: () => { b.textContent = n.v.toFixed(casas).replace(".", ","); }, onComplete: () => { b.textContent = d.preco.valor; } }, t);
    };
    return a;
  };

  // ------------------------------------- foto com profundidade (WebGL)
  // A foto tem um mapa de profundidade (claro = perto). A câmera se desloca
  // e o que está perto anda mais que o que está longe.
  const VS = "attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }";
  const FS = `precision highp float;
    varying vec2 v; uniform sampler2D foto, prof;
    uniform float aspecto, tela, cx, zoom, px, py, dolly, noite, luz;
    vec2 limite(vec2 u){ return clamp(u, vec2(0.002), vec2(0.998)); }
    void main(){
      vec2 s = vec2(v.x, 1.0 - v.y);
      // Foto mais estreita que a tela (foto em pé num quadro largo): o recorte
      // encolhe na altura para a largura caber, em vez de esticar a borda.
      float larg = tela / aspecto / zoom;
      float alt = 1.0 / zoom;
      float sobra = max(1.0, larg / 0.996);
      larg /= sobra; alt /= sobra;
      vec2 u = vec2(cx + (s.x - 0.5) * larg, 0.5 + (s.y - 0.5) * alt);
      vec2 c = vec2(cx, 0.5);
      float d = texture2D(prof, limite(u)).r;
      for (int i = 0; i < 3; i++) {
        vec2 u2 = c + (u - c) * (1.0 - dolly * (d - 0.35)) + (d - 0.35) * vec2(px, py);
        d = texture2D(prof, limite(u2)).r;
      }
      vec2 uf = c + (u - c) * (1.0 - dolly * (d - 0.35)) + (d - 0.35) * vec2(px, py);
      vec3 cor = texture2D(foto, limite(uf)).rgb;
      float brilho = dot(cor, vec3(0.299, 0.587, 0.114));
      vec3 fria = cor * vec3(0.28, 0.36, 0.62) + smoothstep(0.62, 0.9, brilho) * vec3(0.55, 0.42, 0.2);
      cor = mix(cor, fria, noite);
      float faixa = smoothstep(0.16, 0.0, abs((s.x + s.y * 0.35) - luz));
      cor += faixa * (0.10 + 0.14 * d);
      gl_FragColor = vec4(cor, 1.0);
    }`;
  const cenas = [];
  let linhaDoTempo = null;

  function textura(gl, unidade, img) {
    const t = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0 + unidade);
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  function desenhar(c) {
    const gl = c.gl;
    if (!c.pronto) {
      if (!c.foto.complete || !c.prof.complete || !c.foto.naturalWidth || !c.prof.naturalWidth) return;
      textura(gl, 0, c.foto);
      textura(gl, 1, c.prof);
      c.pronto = true;
    }
    const t = linhaDoTempo ? linhaDoTempo.time() : 0;
    // mão na câmera: um balanço mínimo, função só do tempo
    const mx = Math.sin(t * 1.7) * 0.0014 + Math.sin(t * 2.9 + 1.3) * 0.0007;
    const my = Math.sin(t * 1.3 + 0.7) * 0.0011;
    const u = (nome, valor) => gl.uniform1f(gl.getUniformLocation(c.prog, nome), valor);
    gl.useProgram(c.prog);
    gl.uniform1i(gl.getUniformLocation(c.prog, "foto"), 0);
    gl.uniform1i(gl.getUniformLocation(c.prog, "prof"), 1);
    u("aspecto", c.aspecto); u("tela", c.tela); u("cx", c.e.cx); u("zoom", c.e.zoom); u("dolly", c.e.dolly);
    u("noite", c.e.noite); u("luz", c.e.luz); u("px", c.e.px + mx); u("py", c.e.py + my);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  /**
   * Liga a câmera de uma cena. `id` é o do <canvas>; `n` a foto (1 a 5), que
   * o modelo declara em <img id="foto-N"> e <img id="prof-N"> (assim o
   * render espera as imagens carregarem).
   * `de`/`para`: { lado (0 = esquerda, 1 = direita), zoom, px, py, dolly,
   * noite, luz }; o que faltar vale o repouso.
   */
  E.camera = (tl, id, n, t, dur, de, para) => {
    linhaDoTempo = tl;
    const tela = el(id);
    const gl = tela.getContext("webgl", { preserveDrawingBuffer: true, antialias: false });
    if (!gl) return;
    const sh = (tipo, fonte) => { const o = gl.createShader(tipo); gl.shaderSource(o, fonte); gl.compileShader(o); return o; };
    const prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const info = d.fotos[n - 1] || { aspecto: 1.4 };
    const proporcao = tela.width / tela.height;
    const repouso = { lado: 0.5, zoom: 1, px: 0, py: 0, dolly: 0, noite: 0, luz: -0.5 };
    // `lado` vira o centro do recorte, sem deixar a borda da foto aparecer
    const centro = (e) => {
      const meia = Math.min(0.5, proporcao / info.aspecto / e.zoom / 2 + 0.012);
      return meia + (1 - 2 * meia) * e.lado;
    };
    const ini = { ...repouso, ...de }, fim = { ...repouso, ...para };
    const c = { gl, prog, aspecto: info.aspecto, tela: proporcao, pronto: false, foto: el("foto-" + n), prof: el("prof-" + n),
      e: { cx: centro(ini), zoom: ini.zoom, px: ini.px, py: ini.py, dolly: ini.dolly, noite: ini.noite, luz: ini.luz } };
    cenas.push(c);
    tl.to(c.e, { cx: centro(fim), zoom: fim.zoom, px: fim.px, py: fim.py, dolly: fim.dolly, noite: fim.noite, luz: fim.luz, duration: dur, ease: "sine.inOut", onUpdate: () => desenhar(c) }, t);
    c.foto.addEventListener("load", () => desenhar(c));
    c.prof.addEventListener("load", () => desenhar(c));
  };

  window.addEventListener("load", () => cenas.forEach(desenhar));
  window.E = E;
})();
