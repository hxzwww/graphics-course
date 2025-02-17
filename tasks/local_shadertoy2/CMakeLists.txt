
add_executable(local_shadertoy2
  main.cpp
  App.cpp
)

target_link_libraries(local_shadertoy2
  PRIVATE glfw etna glm::glm wsi gui render_utils scene)

target_add_shaders(local_shadertoy2
  shaders/texture.comp
  shaders/toy.frag
  shaders/toy.vert
)
