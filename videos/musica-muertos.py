# Música tranquila para el spot de Día de Muertos: guitarra arpegiada, marimba suave y colchón, sin batería.
import os
exec(open(os.path.join(os.path.dirname(__file__),'musica-redes.py')).read().split('\nD_=3.4')[0])
os.makedirs('public/muertos',exist_ok=True)
D=30.0; n=int(D*SR); gtr=np.zeros(n); mar=np.zeros(n); pd=np.zeros(n); fx=np.zeros(n)
bpm=66; b=60/bpm; compas=3*b  # vals lento (3/4), como canción de velorio alegre
prog=[(57,1),(53,0),(48,0),(52,0)]  # Am F C E
def acordeM(r,m): return [r,r+(3 if m else 4),r+7]
s=0.0; k=0
mel=[76,74,72,71, 72,69,67,69, 72,71,69,68, 69,71,72,76]
mi=0
while s<D-2.5:
    r,m=prog[k%4]; ch=acordeM(r,m)
    add(pd,s,pad([x+12 for x in ch],compas+0.8,brillo=0.25),0.55)
    add(gtr,s,bajo(mtof(r-12),compas*0.9,0.1),0.45)
    arp=[ch[0],ch[1],ch[2],ch[0]+12,ch[2],ch[1]]
    for i,x in enumerate(arp):
        add(gtr,s+i*b/2,pluck(mtof(x+12),1.2,2.5),0.32)
    if s>4.9:  # la marimba entra cuando cae el pan
        for j in range(3):
            if j!=1 or k%2==0:
                add(mar,s+j*b,marimba(mtof(mel[mi%len(mel)]),1.4),0.22); mi+=1
    s+=compas; k+=1
# campanitas suaves cuando cae cada cosa y en las olas
for c in [4.9,8.2,9.9,12.1,13.3]: add(fx,c+0.3,bell(mtof(88),1.4),0.08)
for c in [14.3,17.6]: add(fx,c+0.2,whoosh(1.2),0.22)
# final: acorde largo de La menor que se apaga
fin=D-2.6
for j,x in enumerate([57,60,64,69]): add(gtr,fin+j*0.09,pluck(mtof(x+12),2.4,1.5),0.35)
add(pd,fin,pad([69,72,76],2.6,brillo=0.2),0.7)
mix=reverb(gtr+mar,1.8,0.38)+pd+fx
mix=mix/np.max(np.abs(mix))
a=int(0.4*SR); mix[:a]*=np.linspace(0,1,a); z=int(1.2*SR); mix[-z:]*=np.linspace(1,0,z)
mix*=0.6
st=np.stack([mix,np.roll(mix,240)],1)
with wave.open('public/muertos/musica.wav','wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st*32767).astype(np.int16).tobytes())
print('ok')
