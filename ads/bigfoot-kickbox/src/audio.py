import numpy as np, wave
SR=44100; D=15.0; N=int(SR*D); L=np.zeros(N); R=np.zeros(N)
rng=np.random.default_rng(3)
def add(sig,t,g=1.0,pan=0.0):
    i=int(t*SR); s=sig[:max(0,N-i)]*g
    L[i:i+len(s)]+=s*(1-pan)*0.5*2**.5; R[i:i+len(s)]+=s*(1+pan)*0.5*2**.5
def env(n,a,d): 
    e=np.ones(n); na=int(a*SR); e[:na]=np.linspace(0,1,na) if na else 1; e*=np.exp(-np.arange(n)/(d*SR)); return e
def kick():
    n=int(.45*SR); t=np.arange(n)/SR; f=48+120*np.exp(-t*30); ph=2*np.pi*np.cumsum(f)/SR
    return np.tanh(2.2*np.sin(ph)*np.exp(-t*7))*0.9
def clap():
    n=int(.25*SR); x=rng.normal(size=n); e=np.zeros(n)
    for o in (0,.011,.022): i=int(o*SR); e[i:]+=np.exp(-np.arange(n-i)/(.05*SR))
    x=np.diff(np.concatenate([[0],x]))  # bright
    return x*e*0.18
def hat(o=False):
    n=int((.25 if o else .06)*SR); x=np.diff(np.concatenate([[0],rng.normal(size=n)]))
    return x*np.exp(-np.arange(n)/((.08 if o else .015)*SR))*0.07
def bass(freq,dur):
    n=int(dur*SR); t=np.arange(n)/SR
    s=np.tanh(1.8*(np.sin(2*np.pi*freq*t)+0.5*np.sin(4*np.pi*freq*t)))
    e=np.minimum(1,t/.005)*np.exp(-t*3.5); return s*e*0.28
def stab(freqs,dur):
    n=int(dur*SR); t=np.arange(n)/SR; s=0
    for f in freqs:
        for dt in (-0.12,0.12): s=s+((2*((f*(1+dt/100)*t)%1))-1)
    s/= (len(freqs)*2); 
    # simple lowpass via moving avg
    k=6; s=np.convolve(s,np.ones(k)/k,'same')
    return s*np.minimum(1,t/.003)*np.exp(-t*7)*0.22
def impact():
    n=int(1.0*SR); t=np.arange(n)/SR
    boom=np.sin(2*np.pi*np.cumsum(40+90*np.exp(-t*18))/SR)*np.exp(-t*4)
    noise=rng.normal(size=n)*np.exp(-t*22)*0.5
    return np.tanh(1.6*(boom+noise))*0.75
def whoosh(dur,up=True):
    n=int(dur*SR); x=rng.normal(size=n); t=np.linspace(0,1,n)
    # sweep a one-pole lowpass cutoff
    c=(0.02+0.5*t**2) if up else (0.5-0.48*t)
    y=np.zeros(n); z=0
    for i in range(n): z+=c[i]*(x[i]-z); y[i]=z
    e=np.sin(np.pi*t)**1.5 if not up else t**2
    return y*e*0.9
def riser(dur):
    n=int(dur*SR); t=np.arange(n)/SR; f=200*2**(t/dur*2.5)
    return (np.sin(2*np.pi*np.cumsum(f)/SR)*0.25+whoosh(dur)*0.6)*(t/dur)**2*0.6

BPM=120; B=60/BPM
roots=[55.0,55.0,43.65,49.0]  # A, A, F, G
for i in range(int(12.25/B)):
    t=i*B
    if t<0.25: continue
    add(kick(),t,1.0)
    add(hat(),t+B/2,1.0,0.3)
    if i%2==1: add(clap(),t,1.0,-0.1)
    if i%4==3: add(hat(True),t+B*0.75,0.8,-0.3)
    bar=(i//4)%4; f=roots[bar]
    add(bass(f,B*0.45),t+B/2,1.0)
    if i%4 in (0,2): add(stab([f*4,f*4*1.189,f*4*1.498],0.3),t+(B*0.75 if i%4==2 else 0),1.0,0.2)
# intro hits
add(impact(),0.25,1.0); add(impact(),0.75,0.8)
# keyword punches
for s in [2.05,2.80,3.55,4.30,5.05,5.80]: add(impact(),s,0.55); add(whoosh(0.18,False),s-0.12,0.35)
# transitions
for a,d in [(1.65,0.6),(6.3,0.6),(9.3,0.6)]: add(whoosh(d,False),a,0.55,0.5)
add(riser(1.5),11.3,0.9)
# logo boom + shimmer
add(impact(),12.75,1.1)
n=int(2.2*SR); t=np.arange(n)/SR
pad=sum(np.sin(2*np.pi*f*t+ph) for f,ph in [(220,0),(277.2,1),(329.6,2),(440,3),(659.3,.5)])/5
add(pad*np.minimum(1,t/.05)*np.exp(-t*1.1)*0.35,12.75)
add(stab([110*4,110*4*1.189,110*4*1.498],1.2),12.75,1.2)
mix=np.stack([L,R],1)
fade=int(.5*SR); mix[-fade:]*=np.linspace(1,0,fade)[:,None]
mix=np.tanh(mix*1.2); mix/=np.abs(mix).max()/0.89
w=wave.open('audio.wav','wb'); w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
w.writeframes((mix*32767).astype(np.int16).tobytes()); w.close()
