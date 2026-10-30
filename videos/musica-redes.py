# Música original sintetizada para cada video: intro, cuerpo con acentos en cada corte y final con golpe y cola.
import numpy as np, wave, sys
SR=44100
rng=np.random.default_rng(7)
def mtof(m): return 440*2**((m-69)/12)
def env(L,a=0.005,d=0.3):
    tt=np.arange(L)/SR; return np.minimum(1,tt/a)*np.exp(-tt/d)
def add(buf,s,x,g=1.0):
    i=int(s*SR)
    if i>=len(buf): return
    x=x[:len(buf)-i]; buf[i:i+len(x)]+=x*g
def marimba(f,dur=0.9):
    L=int(dur*SR); tt=np.arange(L)/SR
    return (np.sin(2*np.pi*f*tt)*np.exp(-tt*4)+0.35*np.sin(2*np.pi*f*3.93*tt)*np.exp(-tt*14)+0.12*np.sin(2*np.pi*f*9.2*tt)*np.exp(-tt*30))*np.minimum(1,tt/0.002)
def pluck(f,dur=0.5,brillo=6):
    L=int(dur*SR); tt=np.arange(L)/SR
    return sum((1/k)*np.sin(2*np.pi*f*k*tt)*np.exp(-tt*(5+k*brillo)) for k in range(1,8))*np.minimum(1,tt/0.002)
def bell(f,dur=1.6):
    L=int(dur*SR); tt=np.arange(L)/SR
    return (np.sin(2*np.pi*f*tt+2*np.sin(2*np.pi*f*3.5*tt)*np.exp(-tt*3))*np.exp(-tt*2.2))*np.minimum(1,tt/0.003)
def bajo(f,dur=0.4,saw=0.3):
    L=int(dur*SR); tt=np.arange(L)/SR
    s=np.sin(2*np.pi*f*tt)+saw*np.sin(2*np.pi*2*f*tt)*0.5
    return s*np.minimum(1,tt/0.004)*np.exp(-tt/(dur*0.6))
def b808(f,dur=0.9):
    L=int(dur*SR); tt=np.arange(L)/SR
    fr=f*(1+1.5*np.exp(-tt*40)); return np.tanh(1.6*np.sin(2*np.pi*np.cumsum(fr)/SR))*np.exp(-tt*2.2)
def kick(g=1.0):
    L=int(0.35*SR); tt=np.arange(L)/SR; f=48+110*np.exp(-tt*35)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*10)*g
def ruido(L,dec,hp=True):
    x=rng.standard_normal(L)*np.exp(-np.arange(L)/SR*dec)
    return np.diff(x,prepend=0) if hp else x
def clap():
    L=int(0.25*SR); x=ruido(L,18)*0.5; d=int(0.012*SR); x[d:]+=ruido(L-d,25)*0.4; return x
def hat(L=0.05,dec=90): return ruido(int(L*SR),dec)*0.5
def guira(): # raspado de güira para la cumbia
    L=int(0.11*SR); tt=np.arange(L)/SR
    return ruido(L,0,True)*np.sin(np.pi*tt/0.11)*0.35*(1+0.6*np.sin(2*np.pi*90*tt))
def pad(notas,dur,dt=0.004,brillo=0.4):
    L=int(dur*SR); tt=np.arange(L)/SR; s=np.zeros(L)
    for m in notas:
        f=mtof(m)
        for d in (-dt,dt):
            ph=2*np.pi*f*(1+d)*tt
            s+=np.sin(ph)+brillo*0.5*np.sin(2*ph)+brillo*0.25*np.sin(3*ph)
    a=min(0.6,dur/3); e=np.minimum(1,tt/a)*np.minimum(1,(dur-tt)/a)
    return s/len(notas)*e*0.25
def subida(dur):
    L=int(dur*SR); tt=np.arange(L)/SR
    return ruido(L,0)*(tt/dur)**2.5*0.25+np.sin(2*np.pi*np.cumsum(200+1600*(tt/dur)**2)/SR)*(tt/dur)**3*0.05
def golpe(dur=1.2):
    L=int(dur*SR); tt=np.arange(L)/SR
    return np.sin(2*np.pi*42*tt)*np.exp(-tt*5)*0.9+ruido(L,14,False)*0.25
def whoosh(dur=0.7):
    L=int(dur*SR); tt=np.arange(L)/SR; x=ruido(L,0,True); w=np.sin(np.pi*tt/dur)**2
    return x*w*0.3
def pop():
    L=int(0.12*SR); tt=np.arange(L)/SR; f=300+900*np.exp(-tt*40)
    return np.sin(2*np.pi*np.cumsum(f)/SR)*np.exp(-tt*35)*0.5
def reverb(x,seg=1.4,mix=0.22):
    L=int(seg*SR); ir=rng.standard_normal(L)*np.exp(-np.arange(L)/SR*4.5); ir[0]=0
    n=len(x)+L; N=1<<(n-1).bit_length()
    w=np.fft.irfft(np.fft.rfft(x,N)*np.fft.rfft(ir,N),N)[:len(x)]
    return x+w/np.max(np.abs(w)+1e-9)*np.max(np.abs(x))*mix
def acorde(raiz,menor=False): return [raiz,raiz+(3 if menor else 4),raiz+7]

def cancion(nombre,D,cortes,bpm,prog,estilo):
    n=int(D*SR); mel=np.zeros(n); bat=np.zeros(n); bj=np.zeros(n); fx=np.zeros(n); pd=np.zeros(n)
    b=60/bpm; compas=4*b; intro=min(2*b*2, cortes[1]-0.3 if len(cortes)>1 else 2.0)
    fin=D-1.8  # golpe final
    k=0; s=0.0
    while s<fin:
        raiz,menor=prog[k%len(prog)]; ch=acorde(raiz,menor)
        add(pd,s,pad([m+12 for m in ch],compas+0.6),1.0)
        for i in range(8):  # corcheas
            ti=s+i*b/2
            if ti>=fin: break
            enIntro=ti<intro
            if estilo=='marimba':
                m=ch[[0,1,2,1,2,0,1,2][i]]+24+(12 if i in (4,6) else 0)
                add(mel,ti,marimba(mtof(m)),0.5 if not enIntro else 0.3)
                if i%2==1: add(mel,ti+b/4,marimba(mtof(m+7)),0.18)  # trémolo de marimba
                if not enIntro:
                    if i in (0,4): add(bj,ti,bajo(mtof(raiz-12),b*1.6),0.6)
                    if i%2==1: add(bat,ti,hat(0.08,40),0.25)
                    if i in (2,6): add(bat,ti,ruido(int(0.15*SR),30)*0.3,0.6)
            elif estilo=='pizz':
                patron=[0,None,2,1,None,2,0,1]
                if patron[i] is not None: add(mel,ti,pluck(mtof(ch[patron[i]]+24),0.35,9),0.5)
                if i==7 and k%2: add(mel,ti+b/4,pluck(mtof(ch[2]+36),0.25,12),0.3)
                if not enIntro:
                    if i in (0,3,4,7): add(bj,ti,bajo(mtof(raiz-12),b*0.45,0.6),0.6)
                    if i in (0,4): add(bat,ti,kick(),0.8)
                    if i in (2,6): add(bat,ti,clap(),0.55)
                    add(bat,ti,hat(),0.18)
            elif estilo=='pop':
                if i in (0,3,6) : add(mel,ti,bell(mtof(ch[[2,1,0][i//3]]+24)),0.22)
                if not enIntro:
                    if i==0: add(bj,ti,b808(mtof(raiz-24),compas*0.45),0.55)
                    if i==5: add(bj,ti,b808(mtof(raiz-24),b),0.4)
                    if i in (0,5): add(bat,ti,kick(1.1),0.9)
                    if i==4: add(bat,ti,clap(),0.6)
                    add(bat,ti,hat(0.04,120),0.16)
                    add(bat,ti+b/4,hat(0.03,160),0.08)
            elif estilo=='cumbia':
                if i in (0,2,3,5,6): add(mel,ti,pluck(mtof(ch[[0,1,2,1,0,2,1,0][i]]+24),0.3,5),0.32)
                if i in (2,6): add(mel,ti,pluck(mtof(ch[1]+36),0.18,10),0.15)
                if not enIntro:
                    if i==0: add(bj,ti,bajo(mtof(raiz-12),b*0.9),0.65)
                    if i==3: add(bj,ti,bajo(mtof(raiz-5),b*0.4),0.5)
                    if i==4: add(bj,ti,bajo(mtof(raiz-5),b*0.9),0.6)
                    add(bat,ti,guira(),0.5 if i%2 else 0.32)
                    if i in (0,4): add(bat,ti,kick(0.8),0.6)
                    if i in (2,6): add(bat,ti,ruido(int(0.12*SR),35),0.35)
        s+=compas; k+=1
    # intro: subida que desemboca en la entrada de la batería
    add(fx,max(0,intro-1.4),subida(1.4),1.0)
    # acentos en cada corte (sin repetir el del inicio)
    for c in cortes[1:]:
        if c<fin-0.2:
            add(fx,c,whoosh(0.5) if estilo!='pizz' else pop(),0.9 if estilo!='pizz' else 1.0)
    # final: subida, golpe y acorde largo que se apaga
    add(fx,fin-1.0,subida(1.0),0.8)
    add(fx,fin,golpe(1.8),0.7)
    raiz,menor=prog[0]; ch=acorde(raiz,menor)
    for j,m in enumerate(ch+[ch[0]+12]):
        f=mtof(m+24)
        add(mel,fin+j*0.04,(marimba(f,1.8) if estilo=='marimba' else bell(f,1.8) if estilo=='pop' else pluck(f,1.8,2)),0.35)
    add(pd,fin,pad([m+12 for m in ch],1.8),1.2)
    add(bj,fin,bajo(mtof(raiz-12),1.6,0.2),0.7)
    mix=reverb(mel,1.4,0.35)+pd+bj+bat+fx
    mix=np.tanh(mix/np.max(np.abs(mix))*1.4)
    a=int(0.03*SR); mix[:a]*=np.linspace(0,1,a); z=int(0.5*SR); mix[-z:]*=np.linspace(1,0,z)
    mix=mix/np.max(np.abs(mix))*0.89
    st=np.stack([mix,np.roll(mix,180)],1)
    with wave.open(nombre,'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes())
    print(nombre)

D_=3.4
# Re mayor, I–V–vi–IV (marimba chiapaneca) · Fa mayor juguetón · La menor pop · Sol mayor cumbia
cancion('sabado.wav',24.8,[k*D_ for k in range(8)],100,[(62,0),(69,0),(71,1),(67,0)],'marimba')
cancion('domingo.wav',28.2,[k*D_ for k in range(9)],120,[(65,0),(70,0),(72,0),(65,0)],'pizz')
cancion('producto.wav',22.0,[0,3.6,7.2,8.1,9.5,11.6,16.6],90,[(57,1),(53,0),(60,0),(55,0)],'pop')
cancion('camion.wav',22.0,[0,4.2,9.0,15.0],112,[(67,0),(60,0),(62,0),(67,0)],'cumbia')
