'use strict';

// Native SVG keeps the graph page sharp, responsive and available offline.
const GraphLibrary = (() => {
  const NS = 'http://www.w3.org/2000/svg';
  const data = GRAPH_LIBRARY_DATA;
  const unitIds = [...new Set(data.map(graph => graph.unit))].sort((a,b)=>a-b);
  const el = selector => document.querySelector(selector);
  const graphCount = id => data.filter(graph=>graph.unit===id).length;
  let selection = unitIds[0];
  let guidesVisible = true;
  let resizeObserver = null;
  let frame = null;
  let initialized = false;
  const canvas = document.createElement('canvas');
  const measure = canvas.getContext('2d');

  function node(tag, className, text) {
    const n = document.createElement(tag);
    if (className) n.className = className;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function svgNode(tag, attrs={},text) {
    const n = document.createElementNS(NS,tag);
    for(const [key,value] of Object.entries(attrs)) n.setAttribute(key,String(value));
    if(text!==undefined)n.textContent=text;
    return n;
  }

  function textLines(text,width,fontSize) {
    measure.font = `500 ${fontSize}px Manrope, sans-serif`;
    const lines=[];
    let line='';
    for(const word of text.split(' ')) {
      const next=line ? `${line} ${word}` : word;
      if(line && measure.measureText(next).width>width){lines.push(line);line=word;}
      else line=next;
    }
    if(line)lines.push(line);
    return lines;
  }

  function svgText(parent,text,x,y,{width=500,size=12,anchor='start',className='',gap=16}={}) {
    const lines=textLines(text,width,size);
    const n=svgNode('text',{x,y,'text-anchor':anchor,'font-size':size,class:className});
    lines.forEach((line,i)=>n.append(svgNode('tspan',{x,dy:i===0?0:gap},line)));
    parent.append(n);
    return lines.length;
  }

  function markerLabel(svg,text,x,y,left,right) {
    measure.font='600 10px Manrope, sans-serif';
    const width=measure.measureText(text).width+10;
    const start=Math.max(left,Math.min(x-width/2,right-width));
    svg.append(svgNode('rect',{x:start,y:y-11,width,height:16,rx:3,class:'marker-backdrop'}));
    svgText(svg,text,start+5,y,{size:10,width:width-8,className:'graph-marker-text'});
  }

  function drawPyramid(svg,plot,width,height) {
    svgText(svg,'Energy transferred per area per time',width/2,24,{anchor:'middle',width:width-20,size:12,className:'graph-axis-title'});
    const top=54,bottom=height-50,barHeight=(bottom-top)/plot.levels.length-8;
    plot.levels.forEach((level,i)=>{
      const barWidth=(width-18)*level.width;
      const y=top+i*(barHeight+8);
      svg.append(svgNode('rect',{x:(width-barWidth)/2,y,width:barWidth,height:barHeight,rx:2,class:`pyramid-bar pyramid-level-${i}`}));
      // Text remains legible even when a schematic tier is narrow.
      svgText(svg,level.label,width/2,y+barHeight/2+4,{anchor:'middle',size:11,width:width-12,className:'pyramid-label'});
    });
    svgText(svg,'Schematic widths',width/2,height-15,{anchor:'middle',size:10,className:'graph-tick',width:width-20});
  }

  function draw(figure,graph) {
    const width=Math.round(figure.clientWidth);
    if(width<100)return;
    const height=width<400?316:330;
    const svg=svgNode('svg',{viewBox:`0 0 ${width} ${height}`,role:'img','aria-labelledby':`${graph.id}-svg-title ${graph.id}-svg-desc`,class:'graph-svg'});
    svg.append(svgNode('title',{id:`${graph.id}-svg-title`},graph.title));
    const description=graph.plot.type==='pyramid' ? `${graph.read} ${graph.scope}` : `Horizontal axis: ${graph.plot.x.label}. Vertical axis: ${graph.plot.y.label}. ${graph.read} ${graph.scope}`;
    svg.append(svgNode('desc',{id:`${graph.id}-svg-desc`},description));
    figure.replaceChildren(svg);
    const plot=graph.plot;
    if(plot.type==='pyramid'){drawPyramid(svg,plot,width,height);return;}
    const fontSize=width<360?11:12;
    const left=width<360?40:48,right=width-12;
    const yTitleLines=textLines(plot.y.label,right-left,12);
    const top=26+yTitleLines.length*15;
    const xTitleLines=textLines(plot.x.label,right-left,12);
    const bottom=height-42-xTitleLines.length*15;
    const plotWidth=right-left,plotHeight=bottom-top;
    const x=value=>left+(value-plot.x.min)/(plot.x.max-plot.x.min)*plotWidth;
    const y=value=>bottom-(value-plot.y.min)/(plot.y.max-plot.y.min)*plotHeight;
    svgText(svg,plot.y.label,left,16,{width:plotWidth,size:12,className:'graph-axis-title',gap:15});
    const defs=svgNode('defs');
    const clip=svgNode('clipPath',{id:`${graph.id}-clip`});
    clip.append(svgNode('rect',{x:left,y:top,width:plotWidth,height:plotHeight}));
    defs.append(clip);svg.append(defs);

    for(const region of plot.regions||[]) {
      const x1=x(region.from),x2=x(region.to);
      svg.append(svgNode('rect',{x:x1,y:top,width:x2-x1,height:plotHeight,class:'graph-region'}));
      if(region.from>plot.x.min)svg.append(svgNode('line',{x1,y1:top,x2:x1,y2:bottom,class:'graph-event'}));
      markerLabel(svg,region.label,(x1+x2)/2,top+13,x1,x2);
    }

    plot.y.ticks.forEach((tick,index)=>{
      svg.append(svgNode('line',{x1:left,y1:y(tick),x2:right,y2:y(tick),class:'graph-gridline'}));
      svgText(svg,plot.y.tickLabels?.[index]??String(tick),left-8,y(tick)+4,{anchor:'end',width:left-4,size:fontSize,className:'graph-tick'});
    });
    svg.append(svgNode('line',{x1:left,y1:top,x2:left,y2:bottom,class:'graph-axis'}));
    svg.append(svgNode('line',{x1:left,y1:bottom,x2:right,y2:bottom,class:'graph-axis'}));

    if(plot.type==='bar') {
      const slot=plotWidth/plot.bars.length;
      plot.bars.forEach((bar,i)=>{
        const centre=left+slot*(i+0.5);
        svg.append(svgNode('rect',{x:centre-slot*0.3,y:y(bar.value),width:slot*0.6,height:bottom-y(bar.value),class:'graph-bar'}));
        svgText(svg,bar.label,centre,bottom+20,{anchor:'middle',size:fontSize,className:'graph-tick',width:slot});
      });
    } else {
      plot.x.ticks.forEach((tick,index)=>{
        svg.append(svgNode('line',{x1:x(tick),y1:bottom,x2:x(tick),y2:bottom+5,class:'graph-axis'}));
        const anchor=index===0?'start':index===plot.x.ticks.length-1?'end':'middle';
        svgText(svg,String(tick),x(tick),bottom+21,{anchor,size:fontSize,className:'graph-tick',width:60});
      });
    }
    svgText(svg,plot.x.label,left+plotWidth/2,bottom+43,{anchor:'middle',width:plotWidth,size:12,className:'graph-axis-title',gap:15});
    if(plot.zeroLine)svg.append(svgNode('line',{x1:left,y1:y(0),x2:right,y2:y(0),class:'graph-reference'}));
    for(const line of plot.horizontal||[]) {
      svg.append(svgNode('line',{x1:left,y1:y(line.y),x2:right,y2:y(line.y),class:'graph-reference'}));
      markerLabel(svg,line.label,right-30,y(line.y)-6,left,right);
    }
    const marks=svgNode('g',{'clip-path':`url(#${graph.id}-clip)`});
    if(plot.type==='histogram') {
      for(const bin of plot.bins)marks.append(svgNode('rect',{x:x(bin.from),y:y(bin.value),width:x(bin.to)-x(bin.from),height:bottom-y(bin.value),class:'graph-histogram'}));
    }
    (plot.series||[]).forEach((series,index)=>{
      const path=series.points.map(([px,py],i)=>`${i?'L':'M'}${x(px).toFixed(2)},${y(py).toFixed(2)}`).join(' ');
      marks.append(svgNode('path',{d:path,class:`graph-curve graph-series-${index+1}`}));
    });
    svg.append(marks);
    (plot.events||[]).forEach(event=>{
      svg.append(svgNode('line',{x1:x(event.x),y1:top+20,x2:x(event.x),y2:bottom,class:'graph-event'}));
      markerLabel(svg,event.label,x(event.x),top+12,left,right);
    });
  }

  function scheduleDraw() {
    cancelAnimationFrame(frame);
    frame=requestAnimationFrame(()=>{
      document.querySelectorAll('.graph-figure').forEach(figure=>{
        const graph=data.find(item=>item.id===figure.dataset.graphId);
        if(graph)draw(figure,graph);
      });
    });
  }

  function card(graph) {
    const article=node('article','graph-card');
    article.id=`graph-${graph.id}`;
    const heading=node('h3','',graph.title);
    heading.id=`${graph.id}-heading`;
    article.setAttribute('aria-labelledby',heading.id);
    const figure=node('figure','graph-figure');
    figure.dataset.graphId=graph.id;
    const graphSide=node('div','graph-visual');
    graphSide.append(heading);
    if(graph.plot.series?.length>1) {
      const legend=node('ul','graph-legend');
      graph.plot.series.forEach((series,index)=>{
        const li=node('li');
        const swatch=node('span',`legend-swatch graph-series-${index+1}`);
        swatch.setAttribute('aria-hidden','true');li.append(swatch,node('span','',series.label));legend.append(li);
      });
      graphSide.append(legend);
    }
    graphSide.append(figure,node('p','graph-schematic','Illustrative schematic · not experimental data'));
    const info=node('div','graph-info');
    const guide=node('div','graph-guide');
    guide.hidden=!guidesVisible;
    guide.append(node('h4','','Read the graph'),node('p','',graph.read),node('h4','','Remember'),node('p','',graph.remember));
    info.append(guide,node('p','graph-scope',graph.scope));
    const refs=node('div','graph-references');
    refs.append(node('span','reference-label','Graph references'));
    for(const key of graph.refs) {
      const ref=GRAPH_REFERENCES[key];
      const link=node('a','',`${ref.label} ↗`);
      link.href=ref.url;link.target='_blank';link.rel='noopener noreferrer';refs.append(link);
    }
    info.append(refs);article.append(graphSide,info);
    return article;
  }

  function render(next) {
    init();
    if(next==='all')selection='all';
    else if(unitIds.includes(Number(next)))selection=Number(next);
    const selectedIds=selection==='all'?unitIds:[selection];
    el('#graph-unit-select').value=String(selection);
    el('#graph-unit-count').textContent=selection==='all'?`${data.length} graphs across ${unitIds.length} units`:`${graphCount(selection)} ${graphCount(selection)===1?'graph':'graphs'} in this unit`;
    el('#graphs-content').replaceChildren();
    for(const id of selectedIds) {
      const meta=UNIT_META.find(unit=>unit.id===id);
      const section=node('section','graph-unit-section');
      section.setAttribute('aria-labelledby',`graph-unit-title-${id}`);
      const header=node('div','graph-unit-heading');
      const titleBox=node('div');
      titleBox.append(node('p','course-label',`Unit ${String(id).padStart(2,'0')}`));
      const h2=node('h2','',meta.title);h2.id=`graph-unit-title-${id}`;titleBox.append(h2);
      const link=node('a','back-link','Study flashcards →');link.href=`#unit-${id}`;
      header.append(titleBox,link);
      const grid=node('div','graph-grid');
      for(const graph of data.filter(item=>item.unit===id))grid.append(card(graph));
      section.append(header,grid);el('#graphs-content').append(section);
    }
    const unitIndex=unitIds.indexOf(selection);
    el('#graph-prev').disabled=selection==='all'||unitIndex===0;
    el('#graph-next').disabled=selection==='all'||unitIndex===unitIds.length-1;
    resizeObserver?.disconnect();
    if(typeof ResizeObserver!=='undefined') {
      resizeObserver=new ResizeObserver(scheduleDraw);
      document.querySelectorAll('.graph-figure').forEach(figure=>resizeObserver.observe(figure));
    }
    scheduleDraw();
  }

  function init() {
    if(initialized)return;
    initialized=true;
    el('#graphs-intro-count').textContent=`${data.length} graphs · ${DIAGRAM_LIBRARY_DATA.length} diagrams · available offline`;
    const all=node('option','','All graph units');all.value='all';el('#graph-unit-select').append(all);
    unitIds.forEach(id=>{
      const unit=UNIT_META.find(item=>item.id===id);
      const option=node('option','',`${String(id).padStart(2,'0')} · ${unit.title} (${graphCount(id)})`);
      option.value=id;el('#graph-unit-select').append(option);
    });
    el('#graph-unit-select').addEventListener('change',event=>{location.hash=`graphs-${event.target.value}`;});
    el('#graph-prev').addEventListener('click',()=>{location.hash=`graphs-${unitIds[unitIds.indexOf(selection)-1]}`;});
    el('#graph-next').addEventListener('click',()=>{location.hash=`graphs-${unitIds[unitIds.indexOf(selection)+1]}`;});
    el('#graph-guides').addEventListener('change',event=>{
      guidesVisible=event.target.checked;
      document.querySelectorAll('.graph-guide').forEach(guide=>{guide.hidden=!guidesVisible;});
    });
    document.fonts?.ready.then(scheduleDraw);
    window.addEventListener('resize',scheduleDraw);
  }
  return {init,render,has:id=>unitIds.includes(id),count:graphCount,total:data.length};
})();
