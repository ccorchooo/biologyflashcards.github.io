/* Original teaching schematics. Example numbers are not experimental data. */
const GRAPH_REFERENCES = {
  osmosis: {label:'Hachette Learning · osmosis practical, Figure 8.7',url:'https://media.hachettelearning.com/media/medialibraries/hodder/samples/biology/14-16/ccea-gcse-biology/ccea-gcse-biology-third-edition-sample-pages-9781471892158.pdf#page=5',evidence:'Percentage mass change on the vertical axis; sucrose concentration on the horizontal axis; use a best-fit trend.'},
  osmosisResult: {label:'Save My Exams · analysing osmosis results',url:'https://www.savemyexams.com/gcse/biology/aqa/18/revision-notes/1-cell-biology/1-3-transport-in-cells/1-3-5-required-practical-osmosis/',evidence:'The zero-change crossing estimates the solution concentration with no net mass change.'},
  enzymeT: {label:'Save My Exams · enzymes and temperature',url:'https://www.savemyexams.com/igcse/biology/cie/23/revision-notes/5-enzymes/5-1-enzymes/5-1-4-enzymes-and-temperature/',evidence:'An asymmetric activity curve rises to an optimum then falls sharply as enzymes denature.'},
  enzymePH: {label:'Save My Exams · enzymes and pH',url:'https://www.savemyexams.com/igcse/biology/cie/23/revision-notes/5-enzymes/5-1-enzymes/5-1-5-enzymes-and-ph/',evidence:'An activity-versus-pH curve has a peak at the enzyme-specific optimum; the illustrated intestinal enzyme peaks near pH 8.'},
  enzymeS: {label:'Save My Exams · factors affecting enzymes',url:'https://www.savemyexams.com/gcse/biology/edexcel/18/revision-notes/1-key-concepts-in-biology/1-2-enzymes/1-2-2-factors-affecting-enzymes/',evidence:'Reaction rate rises with substrate supply, then levels off when the fixed enzyme supply is saturated.'},
  photosynthesis: {label:'Save My Exams · photosynthesis limiting-factor graphs',url:'https://www.savemyexams.com/igcse/biology/cie/23/revision-notes/6-plant-nutrition/6-1-photosynthesis-and-leaf-structure/6-1-9-limiting-factors/',evidence:'Light and carbon dioxide graphs rise then plateau; the temperature graph rises to an optimum then declines.'},
  transpirationGraphs: {label:'Revise Direct · transpiration graph shapes',url:'https://revisedirect.com/igcse-biology-transport-in-plants',evidence:'Humidity produces a falling trend; temperature a rising trend; wind initially increases the rate before its effect becomes smaller.'},
  transpiration: {label:'Save My Exams · factors affecting transpiration',url:'https://www.savemyexams.com/igcse/biology/cie/23/revision-notes/8-transport-in-plants/8-1-transport-in-plants/8-1-7-explaining-the-effects-of-temperature-wind-speed-and-humidity/',evidence:'Biological explanation of the effects of temperature, wind and humidity.'},
  heart: {label:'Cambridge 0610 · exercise graph, Question 17 (SME-hosted)',url:'https://cdn.savemyexams.com/uploads/2019/06/CIE_IGCSE_Biology_0610_w16_MA_13.pdf#page=20',evidence:'Heart rate is plotted against time; it increases during exercise and declines during recovery.'},
  immunity: {label:'OpenStax · primary and secondary responses, Figure 21.24',url:'https://openstax.org/books/anatomy-and-physiology-2e/pages/21-4-the-adaptive-immune-response-b-lymphocytes-and-antibodies',evidence:'Antibody concentration against time with first and later exposure to the same antigen.'},
  breathing: {label:'Save My Exams · analysing a breathing trace',url:'https://www.savemyexams.com/dp/biology/ib/23/sl/revision-notes/form-and-function/gas-exchange/measuring-lung-volumes-skills/',evidence:'Volume versus time; exercise increases wave height and the number of complete cycles in a fixed interval. Used here only for rate and depth.'},
  respirometer: {label:'Nuffield / Royal Society of Biology · respirometer practical',url:'https://practicalbiology.org/energy/gas-balance-in-respiration-and-photosynthesis/measuring-the-rate-of-metabolism.html',evidence:'The practical specifies plotting meniscus position against time. This graph defines positive displacement towards the organism chamber.'},
  glucose: {label:'Cambridge · 2023 specimen Paper 4, Figure 2.1',url:'https://www.cambridgeinternational.org/Images/595821-2023-specimen-paper-4.pdf#page=4',evidence:'Two blood-glucose concentration curves against time after a glucose drink; the responses differ in peak timing, height and recovery.'},
  hormones: {label:'OpenStax · ovarian and uterine cycles, Figure 43.17',url:'https://openstax.org/books/biology-2e/pages/43-4-hormonal-control-of-human-reproduction',evidence:'Separate aligned panels for pituitary hormones, ovarian hormones and endometrial changes across a model cycle.'},
  variation: {label:'Save My Exams · variation graphs',url:'https://www.savemyexams.com/igcse/biology/cie/23/revision-notes/18-variation-and-selection/18-1-variation-and-natural-selection/18-1-1-variation/',evidence:'Height is represented by a histogram; ABO group frequencies by separate categorical bars.'},
  population: {label:'OpenStax · logistic growth, Figure 45.9',url:'https://openstax.org/books/biology-2e/pages/45-3-environmental-limits-to-population-growth',evidence:'An S-shaped population-size curve approaches a carrying capacity as resource limitation increases.'},
  microbes: {label:'OpenStax · microbial growth curve, Figure 9.5',url:'https://openstax.org/books/microbiology/pages/9-1-how-microbes-grow',evidence:'The standard curve uses a logarithmic living-cell axis and lag, exponential, stationary and death phases.'},
  energy: {label:'OpenStax · ecological pyramids, Figure 46.10',url:'https://openstax.org/books/biology-2e/pages/46-2-energy-flow-through-ecosystems',evidence:'Producers form the base; an energy pyramid is upright, with less energy transferred at successive trophic levels.'},
  pollution: {label:'San Diego State University · dissolved-oxygen sag',url:'https://ponce.sdsu.edu/do_sag_equation.html',evidence:'Dissolved oxygen downstream reflects oxygen consumption by organic-waste breakdown and replenishment by reaeration.'}
};

const graphSamples = (start, end, fn, steps=100) => Array.from({length:steps+1},(_,i)=>{
  const x=start+(end-start)*i/steps;
  return [x,fn(x)];
});
const graphLine = (label,points) => ({label,points});
const graphRateAxis = {label:'Relative rate (arbitrary units)',min:0,max:1.15,ticks:[0,0.5,1]};
const graphBell = (x,centre,width) => Math.exp(-(((x-centre)/width)**2));
const graphPlateau = x => x<=45 ? x/50 : x>=65 ? 1 : 0.9+0.1*Math.sin((x-45)/20*Math.PI/2);
const graphTemperature = (t,optimum,fallWidth) => t<=optimum ? Math.sin(Math.PI*t/(2*optimum))**2 : graphBell(t,optimum,fallWidth);

const GRAPH_LIBRARY_DATA = [
  {
    id:'osmosis-mass',unit:3,title:'Osmosis: percentage mass change',
    read:'The zero crossing estimates equal water potential between tissue and solution. Above zero the tissue gained water; below zero it lost water.',
    remember:'Estimate the crossing from a best-fit trend. The example crossing is not a universal value for potatoes.',
    scope:'Illustrative results; real tissue and experimental conditions change the crossing.',refs:['osmosis','osmosisResult'],
    plot:{x:{label:'Sucrose concentration (%)',min:0,max:20,ticks:[0,5,10,15,20]},y:{label:'Change in mass (%)',min:-20,max:20,ticks:[-20,-10,0,10,20]},series:[graphLine('Best-fit trend',graphSamples(0,20,x=>15-1.5*x))],zeroLine:true,events:[{x:10,label:'Zero change'}]}
  },
  {
    id:'enzyme-temperature',unit:5,title:'Enzyme activity and temperature',
    read:'Activity rises to an optimum, then drops rapidly as high temperatures change the active site and reduce substrate binding.',
    remember:'Cold usually slows the enzyme. It does not normally denature it.',
    scope:'The example optimum is 40°C; different enzymes have different optima.',refs:['enzymeT'],
    plot:{x:{label:'Temperature (°C)',min:0,max:70,ticks:[0,20,40,60,70]},y:graphRateAxis,series:[graphLine('Enzyme activity',graphSamples(0,70,t=>graphTemperature(t,40,9)))],events:[{x:40,label:'Optimum'}]}
  },
  {
    id:'enzyme-ph',unit:5,title:'Enzyme activity and pH',
    read:'This intestinal-enzyme example is most active near pH 8. Activity falls on either side as binding becomes less effective.',
    remember:'The optimum depends on the enzyme. Extreme pH can denature it.',
    scope:'A schematic intestinal enzyme; this is not the pH curve of every enzyme.',refs:['enzymePH'],
    plot:{x:{label:'pH',min:0,max:14,ticks:[0,2,4,6,8,10,12,14]},y:graphRateAxis,series:[graphLine('Intestinal enzyme',graphSamples(0,14,p=>graphBell(p,8,1.75)))],events:[{x:8,label:'Optimum'}]}
  },
  {
    id:'enzyme-substrate',unit:5,title:'Enzyme activity and substrate supply',
    read:'Adding substrate raises the rate until the available active sites are occupied. The fixed enzyme supply then limits further increase.',
    remember:'A plateau means a steady rate, not that the reaction has stopped.',
    scope:'Temperature, pH and enzyme concentration are held constant.',refs:['enzymeS'],
    plot:{x:{label:'Substrate concentration (arbitrary units)',min:0,max:100,ticks:[0,25,50,75,100]},y:graphRateAxis,series:[graphLine('Reaction rate',graphSamples(0,100,graphPlateau))]}
  },
  {
    id:'photosynthesis-light',unit:6,title:'Photosynthesis and light intensity',
    read:'More light initially raises the rate. Once the curve levels off, another factor limits photosynthesis.',
    remember:'At the plateau, increasing light alone has little effect.',
    scope:'Carbon dioxide and temperature are controlled; this is a rate-of-photosynthesis sketch.',refs:['photosynthesis'],
    plot:{x:{label:'Light intensity (arbitrary units)',min:0,max:100,ticks:[0,25,50,75,100]},y:graphRateAxis,series:[graphLine('Photosynthesis',graphSamples(0,100,graphPlateau))]}
  },
  {
    id:'photosynthesis-co2',unit:6,title:'Photosynthesis and carbon dioxide',
    read:'Increasing carbon dioxide initially increases photosynthesis. At the plateau, light or temperature may restrict the rate.',
    remember:'Identify the limiting factor separately on each part of the curve.',
    scope:'Other conditions are controlled. Horizontal-axis values are illustrative.',refs:['photosynthesis'],
    plot:{x:{label:'Carbon dioxide concentration (arbitrary units)',min:0,max:100,ticks:[0,25,50,75,100]},y:graphRateAxis,series:[graphLine('Photosynthesis',graphSamples(0,100,graphPlateau))]}
  },
  {
    id:'photosynthesis-temperature',unit:6,title:'Photosynthesis and temperature',
    read:'Warming speeds enzyme-controlled reactions up to a suitable range. Excess heat damages enzymes and the rate falls.',
    remember:'The exact optimum varies between plants and conditions.',
    scope:'Illustrative curve with sufficient light, water and carbon dioxide.',refs:['photosynthesis'],
    plot:{x:{label:'Temperature (°C)',min:0,max:60,ticks:[0,15,30,45,60]},y:graphRateAxis,series:[graphLine('Photosynthesis',graphSamples(0,60,t=>graphTemperature(t,30,9)))],events:[{x:30,label:'Example optimum'}]}
  },
  {
    id:'transpiration-temperature',unit:8,title:'Transpiration and temperature',
    read:'Increasing temperature usually increases water evaporation and diffusion from the leaf, raising transpiration.',
    remember:'Assume water is available and stomata remain open.',
    scope:'A restricted temperature range; extreme heat or water stress can change this pattern.',refs:['transpirationGraphs','transpiration'],
    plot:{x:{label:'Air temperature (°C)',min:10,max:40,ticks:[10,20,30,40]},y:graphRateAxis,series:[graphLine('Transpiration',graphSamples(10,40,t=>0.15+0.85*((t-10)/30)**1.5))]}
  },
  {
    id:'transpiration-humidity',unit:8,title:'Transpiration and humidity',
    read:'More humid air reduces the water-vapour gradient from leaf to atmosphere, so the net loss is slower.',
    remember:'Explain the concentration gradient, rather than saying humid air blocks stomata.',
    scope:'Leaf and air temperatures are matched; other conditions are kept constant.',refs:['transpirationGraphs','transpiration'],
    plot:{x:{label:'Relative humidity (%)',min:0,max:100,ticks:[0,25,50,75,100]},y:graphRateAxis,series:[graphLine('Transpiration',graphSamples(0,100,h=>1-h/100))]}
  },
  {
    id:'transpiration-wind',unit:8,title:'Transpiration and wind speed',
    read:'Wind removes moist air around the leaf. The rate rises, then further air movement can have a smaller effect.',
    remember:'Wind maintains a steeper water-vapour gradient.',
    scope:'Water supply and stomatal opening are maintained; the curve is schematic.',refs:['transpirationGraphs','transpiration'],
    plot:{x:{label:'Wind speed (m/s; example)',min:0,max:8,ticks:[0,2,4,6,8]},y:graphRateAxis,series:[graphLine('Transpiration',graphSamples(0,8,w=>0.2+0.8*(1-Math.exp(-w/1.6))))]}
  },
  {
    id:'heart-exercise',unit:9,title:'Heart rate: exercise and recovery',
    read:'Heart rate rises during exercise and remains elevated during early recovery before approaching the resting level.',
    remember:'Link the rise to oxygen and glucose delivery for faster muscle respiration.',
    scope:'Example heart-rate values; timing and recovery vary between individuals.',refs:['heart'],
    plot:{x:{label:'Time (minutes)',min:0,max:14,ticks:[0,2,6,10,14]},y:{label:'Heart rate (beats/min)',min:0,max:180,ticks:[0,60,120,180]},series:[graphLine('Heart rate',graphSamples(0,14,t=>t<2?70:t<=6?70+80*(1-Math.exp(-(t-2)/0.9)):70+79*Math.exp(-(t-6)/2)))],events:[{x:2,label:'Start'},{x:6,label:'Stop'}]}
  },
  {
    id:'immune-memory',unit:10,title:'Primary and secondary immune responses',
    read:'After the same antigen returns, antibody levels rise sooner and higher, and remain elevated for longer because memory cells respond.',
    remember:'A different antigen can still require a new primary response.',
    scope:'An idealised response to the same antigen; dates and peak heights are illustrative.',refs:['immunity'],
    plot:{x:{label:'Time (days; example)',min:0,max:56,ticks:[0,14,28,42,56]},y:{label:'Antibody concentration (arbitrary units)',min:0,max:1.2,ticks:[0,0.5,1]},series:[graphLine('Antibody to antigen A',graphSamples(0,56,t=>(t<3?0:0.3*(1-Math.exp(-(t-3)/2))*Math.exp(-Math.max(t-9,0)/6))+(t<29?0:1.05*(1-Math.exp(-(t-29)/1.5))*Math.exp(-Math.max(t-37,0)/22))))],events:[{x:0,label:'Antigen A'},{x:28,label:'A again'}]}
  },
  {
    id:'breathing-trace',unit:11,title:'Breathing trace: rate and depth',
    read:'Larger peak-to-trough changes show greater tidal volume. More complete cycles in the same time show faster breathing.',
    remember:'One complete rise-and-fall cycle is one breath. This is a lung-volume convention.',
    scope:'Illustrative volumes. At 15 seconds the sketch changes from resting to exercise breathing.',refs:['breathing'],
    plot:{x:{label:'Time (seconds)',min:0,max:30,ticks:[0,10,15,20,30]},y:{label:'Lung volume (L; example)',min:1.7,max:3.3,ticks:[1.8,2.2,2.6,3.0]},series:[graphLine('Lung volume',graphSamples(0,30,t=>2.5+(t<15?0.25:0.6)*Math.sin(2*Math.PI*(t<15?t/5:3+(t-15)/2.5)),360))],events:[{x:15,label:'Exercise begins'}]}
  },
  {
    id:'respirometer-time',unit:12,title:'Respirometer: movement over time',
    read:'At a steady respiration rate, displacement increases linearly. The slope gives marker speed; multiply by capillary area for oxygen volume per time.',
    remember:'Carbon dioxide is absorbed. Positive displacement here means movement towards the organism chamber.',
    scope:'Example readings after equilibration, at constant temperature in an airtight apparatus.',refs:['respirometer'],
    plot:{x:{label:'Time (minutes)',min:0,max:10,ticks:[0,2,4,6,8,10]},y:{label:'Marker displacement towards chamber (mm)',min:0,max:30,ticks:[0,10,20,30]},series:[graphLine('Living seeds',graphSamples(0,10,t=>2.5*t)),graphLine('Inert control',[[0,0],[10,0]])]}
  },
  {
    id:'blood-glucose',unit:14,title:'Blood glucose after a glucose drink',
    read:'The better-controlled example returns towards its starting level sooner. The other has a higher, more prolonged rise.',
    remember:'Insulin promotes glucose uptake and glycogen storage. Compare peak, timing and recovery using the axes.',
    scope:'Illustrative responses with different example values from the specimen graph.',refs:['glucose'],
    plot:{x:{label:'Time after drink (minutes)',min:0,max:240,ticks:[0,60,120,180,240]},y:{label:'Blood glucose (mg/100 cm³)',min:0,max:240,ticks:[0,60,120,180,240]},series:[graphLine('Better-controlled example',graphSamples(0,240,t=>80+70*(t/35)*Math.exp(1-t/35))),graphLine('Poorer-controlled example',graphSamples(0,240,t=>80+140*(t/75)*Math.exp(1-t/75)))],events:[{x:0,label:'Glucose drink'}]}
  },
  {
    id:'pituitary-hormones',unit:16,title:'Menstrual cycle: FSH and LH',
    read:'The large LH surge occurs around ovulation. FSH supports follicle development and also shows a smaller mid-cycle rise.',
    remember:'FSH and LH are secreted by the pituitary gland.',
    scope:'A model 28-day cycle. Relative levels show timing, not comparable measured hormone concentrations.',refs:['hormones'],
    plot:{x:{label:'Day of model cycle',min:1,max:28,ticks:[1,7,14,21,28]},y:{label:'Relative hormone level (arbitrary units)',min:0,max:1.15,ticks:[0,0.5,1]},series:[graphLine('LH',graphSamples(1,28,d=>0.08+0.92*graphBell(d,13.8,0.9))),graphLine('FSH',graphSamples(1,28,d=>0.15+0.08*graphBell(d,2,3)+0.22*graphBell(d,14,1.4)-0.07*graphBell(d,21,4)+0.05*graphBell(d,28,2)))],events:[{x:14,label:'Ovulation'}]}
  },
  {
    id:'ovarian-hormones',unit:16,title:'Menstrual cycle: oestrogen and progesterone',
    read:'Oestrogen peaks before ovulation. Progesterone rises afterwards as the corpus luteum develops, then falls if pregnancy does not occur.',
    remember:'Progesterone helps maintain the uterine lining.',
    scope:'Same 28-day teaching model; compare the timing of peaks, not absolute amounts.',refs:['hormones'],
    plot:{x:{label:'Day of model cycle',min:1,max:28,ticks:[1,7,14,21,28]},y:{label:'Relative hormone level (arbitrary units)',min:0,max:1.15,ticks:[0,0.5,1]},series:[graphLine('Oestrogen',graphSamples(1,28,d=>0.08+0.85*graphBell(d,12,2.4)+0.45*graphBell(d,21,4))),graphLine('Progesterone',graphSamples(1,28,d=>0.04+0.95*graphBell(d,21,4)))],events:[{x:14,label:'Ovulation'}]}
  },
  {
    id:'uterine-lining',unit:16,title:'Menstrual cycle: the uterine lining',
    read:'The lining is shed during menstruation, rebuilds before ovulation and is maintained afterwards. Falling hormones allow the next period to begin.',
    remember:'Cycle length and timing vary between people and cycles.',
    scope:'Relative thickness in a 28-day teaching model, not a clinical measurement.',refs:['hormones'],
    plot:{x:{label:'Day of model cycle',min:1,max:28,ticks:[1,7,14,21,28]},y:{label:'Relative lining thickness (arbitrary units)',min:0,max:1.15,ticks:[0,0.5,1]},series:[graphLine('Uterine lining',graphSamples(1,28,d=>d<5?0.85-0.67*Math.sin((d-1)/4*Math.PI/2):d<14?0.18+(d-5)/9*0.45:d<24?0.63+(d-14)/10*0.32:d<27?0.95:0.95-0.1*(d-27)))],regions:[{from:1,to:5,label:'Menses'}],events:[{x:14,label:'Ovulation'}]}
  },
  {
    id:'continuous-variation',unit:18,title:'Continuous variation: a height histogram',
    read:'Measurements span a range with intermediate values. Equal-width height intervals are shown with touching bars.',
    remember:'Continuous variation need not always produce a perfectly bell-shaped distribution.',
    scope:'Invented sample of 100 people; each height interval is 5 cm wide.',refs:['variation'],
    plot:{type:'histogram',x:{label:'Height (cm)',min:140,max:190,ticks:[140,150,160,170,180,190]},y:{label:'Number of people',min:0,max:25,ticks:[0,5,10,15,20,25]},bins:[1,3,7,13,20,23,18,10,4,1].map((v,i)=>({from:140+i*5,to:145+i*5,value:v}))}
  },
  {
    id:'discontinuous-variation',unit:18,title:'Discontinuous variation: ABO blood groups',
    read:'ABO groups are separate categories with no intermediate blood groups between them. Use distinct bars with gaps.',
    remember:'The invented frequencies here are not universal population percentages.',
    scope:'Invented sample of 100 people. Bar order does not represent a continuous scale.',refs:['variation'],
    plot:{type:'bar',x:{label:'ABO blood group'},y:{label:'Number of people',min:0,max:50,ticks:[0,10,20,30,40,50]},bars:[{label:'A',value:35},{label:'B',value:18},{label:'AB',value:7},{label:'O',value:40}]}
  },
  {
    id:'logistic-population',unit:19,title:'Population growth and carrying capacity',
    read:'An S-shaped curve slows as resources become limiting, approaching the carrying capacity shown by K.',
    remember:'K depends on the environment; real populations can fluctuate around it.',
    scope:'A simple logistic model with an illustrative carrying capacity of 800 individuals.',refs:['population'],
    plot:{x:{label:'Time (arbitrary units)',min:0,max:10,ticks:[0,2,4,6,8,10]},y:{label:'Population size (individuals)',min:0,max:1000,ticks:[0,250,500,750,1000]},series:[graphLine('Population',graphSamples(0,10,t=>800/(1+Math.exp(-1.1*(t-4)))))],horizontal:[{y:800,label:'K = 800'}]}
  },
  {
    id:'microbial-growth',unit:19,title:'A closed microbial culture',
    read:'The living-cell count passes through lag, exponential, stationary and death phases. On this log axis, exponential growth is a straight rising section.',
    remember:'Equal steps on a log scale mean equal multiplication, not equal additions.',
    scope:'Schematic viable counts in a closed culture; phase durations are illustrative.',refs:['microbes'],
    plot:{x:{label:'Time (hours; example)',min:0,max:24,ticks:[0,6,12,18,24]},y:{label:'Living-cell count (log scale)',min:1,max:9,ticks:[2,4,6,8],tickLabels:['10²','10⁴','10⁶','10⁸']},series:[graphLine('Living cells',[[0,2],[4,2],[10,8],[16,8],[24,2]])],regions:[{from:0,to:4,label:'Lag'},{from:4,to:10,label:'Log'},{from:10,to:16,label:'Stationary'},{from:16,to:24,label:'Death'}]}
  },
  {
    id:'energy-pyramid',unit:19,title:'A pyramid of energy',
    read:'Producers form the base. Less energy is transferred to each successive consumer level as energy is dissipated and material goes uneaten or undigested.',
    remember:'Energy transfer is not always 10%. Energy flows; elements are recycled.',
    scope:'Schematic widths show decreasing energy; they are not a proportional dataset.',refs:['energy'],
    plot:{type:'pyramid',levels:[{label:'Tertiary consumers',width:0.24},{label:'Secondary consumers',width:0.48},{label:'Primary consumers',width:0.74},{label:'Producers',width:1}]}
  },
  {
    id:'oxygen-sag',unit:20,title:'Organic pollution: dissolved oxygen downstream',
    read:'After an organic-waste input, decomposition consumes oxygen. Farther downstream, reduced demand and oxygen replenishment allow recovery.',
    remember:'This is a sewage-pollution sketch. Fertiliser does not directly consume dissolved oxygen.',
    scope:'Illustrative oxygen-sag curve, not a measurement from a particular river.',refs:['pollution'],
    plot:{x:{label:'Distance downstream (km; example)',min:0,max:20,ticks:[0,5,10,15,20]},y:{label:'Dissolved oxygen (mg/L)',min:0,max:10,ticks:[0,2,4,6,8,10]},series:[graphLine('Dissolved oxygen',graphSamples(0,20,x=>8.5-5.6*(x/4)*Math.exp(1-x/4)))],events:[{x:0,label:'Waste enters'}]}
  }
];
