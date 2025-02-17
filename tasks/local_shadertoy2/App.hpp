#pragma once

#include <chrono>

#include <etna/ComputePipeline.hpp>
#include <etna/Image.hpp>
#include <etna/PerFrameCmdMgr.hpp>
#include <etna/Window.hpp>

#include "wsi/OsWindowingManager.hpp"

#include <etna/GraphicsPipeline.hpp>
#include <etna/Sampler.hpp>

struct Constants {
    glm::vec2 iMouse;
    float iTime;
};

class App {
  public:
    App();
    ~App();

    void run();

  private:
    void drawFrame();

  private:
    OsWindowingManager windowing;
    std::unique_ptr<OsWindow> osWindow;

    glm::uvec2 resolution;
    bool useVsync;

    std::unique_ptr<etna::Window> vkWindow;
    std::unique_ptr<etna::PerFrameCmdMgr> commandManager;

    std::chrono::system_clock::time_point startTimePoint_;

    etna::ComputePipeline cPipeline_;
    etna::Image image_;
    etna::Sampler cSampler_;
    etna::GraphicsPipeline gPipeline_;
    etna::Image texture_;
    etna::Sampler gSampler_;

    glm::vec2 mousePos_;
};
