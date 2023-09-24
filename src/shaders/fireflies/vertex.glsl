
uniform float uPixelRatio;
uniform float uSize;
uniform float uTime;

attribute float aScale;

void main()
{
    vec4 modelPosition = modelMatrix * vec4(position, 1.0);


    modelPosition.y += sin(uTime + modelPosition.x * 100.0) * aScale;
    modelPosition.x += sin(uTime + 1.0) * aScale * 0.01;
    modelPosition.z += sin(uTime + modelPosition.x * 100.0) * aScale;

    vec4 viewPosition = viewMatrix * modelPosition;
    vec4 projectionPosition = projectionMatrix * viewPosition;

    gl_Position = projectionPosition;


    gl_PointSize = uSize * aScale * uPixelRatio; //size then randomize thern fix pixel ratio
    gl_PointSize *= (1.0 / - viewPosition.z);
}
