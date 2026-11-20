# Música original para los cortos virales (12–15 s): misma síntesis que musica-redes.py.
import os
src=open(os.path.join(os.path.dirname(__file__),'musica-redes.py')).read().split('\nD_=3.4')[0]
exec(src)
os.makedirs('public/cortos',exist_ok=True)
# pela: pop con golpe en el corte de los 4 s
cancion('public/cortos/pela.wav',13.0,[0,1.8,4.0,9.9],96,[(57,1),(53,0),(60,0),(55,0)],'pop')
# agua: pizzicato juguetón con acento en cada dato
cancion('public/cortos/agua.wav',15.0,[0,1.6,5.4,8.6,11.0],120,[(65,0),(70,0),(72,0),(65,0)],'pizz')
# cosecha: cumbia
cancion('public/cortos/cosecha.wav',13.0,[0,1.8,4.5,7.2],112,[(67,0),(60,0),(62,0),(67,0)],'cumbia')
# quiz: marimba chiapaneca, acento en la revelación
cancion('public/cortos/quiz.wav',12.0,[0,1.35,6.4],100,[(62,0),(69,0),(71,1),(67,0)],'marimba')
# toneladas: marimba con cuenta regresiva y golpe en la revelación (6.6 s)
cancion('public/cortos/toneladas.wav',15.0,[0,1.6,6.6,8.5],104,[(62,0),(67,0),(69,0),(62,0)],'marimba')
# norte: cumbia con acento en cada rótulo
cancion('public/cortos/norte.wav',15.0,[0,2.0,4.8,7.6,10.3],108,[(69,1),(62,1),(64,0),(69,1)],'cumbia')
