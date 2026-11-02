/* Entradas adaptadas a la Traducción del Nuevo Mundo (TNM). Se SUMAN al banco. */
(function () {
  var T = {
    A: [
      ['p',3,'Ageo','Profeta que, en el segundo año de Darío, animó a Zorobabel y al sumo sacerdote a reconstruir la casa de Jehová.']
    ],
    C: [
      ['o',1,'Congregación','Grupo de seguidores de Cristo; en la TNM es la palabra usada para el conjunto de cristianos de una ciudad, como la de Corinto.','Asamblea']
    ],
    E: [
      ['o',1,'Espíritu santo','Fuerza activa de Dios que descendió sobre los discípulos en Pentecostés, con lenguas como de fuego.','Espíritu']
    ],
    H: [
      ['p',3,'Hofní','Hijo de Elí que, junto con su hermano Finehás, murió el día en que el arca fue capturada.'],
      ['o',3,'Har–Magedón','Lugar simbólico donde los reyes de toda la tierra se reúnen para la guerra del gran día de Dios, según el último libro de la Biblia.','Armagedón'],
      ['p',3,'Hamán','Funcionario del rey Asuero que tramó exterminar a los judíos, pero terminó colgado en la estaca que había preparado.','Amán']
    ],
    J: [
      ['p',2,'Jesé','Padre de David, vecino de Belén.','Isaí'],
      ['p',3,'Jokébed','Madre de Moisés, Aarón y Miriam, de la tribu de Leví.']
    ],
    M: [
      ['o',1,'Madero de tormento','En la TNM, el instrumento en que Jesús fue ejecutado en el Gólgota.','Estaca de tormento']
    ],
    P: [
      ['p',3,'Pérez','Hijo gemelo de Judá y Tamar, antepasado de David, cuyo nombre recuerda que se abrió paso al nacer.','Fares']
    ],
    T: [
      ['o',2,'Testigos de Jehová','Nombre que Isaías 43:10 aplica al pueblo que Dios escogió para dar a conocer a su Creador.']
    ]
  };
  window.BANCO = window.BANCO || {};
  Object.keys(T).forEach(function (k) {
    window.BANCO[k] = (window.BANCO[k] || []).concat(T[k]);
  });
})();
