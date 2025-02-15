#pragma once

#include <chrono>

#include <etna/ComputePipeline.hpp>
#include <etna/Image.hpp>
#include <etna/PerFrameCmdMgr.hpp>
#include <etna/Sampler.hpp>
#include <etna/Window.hpp>

#include "wsi/OsWindowingManager.hpp"

struct Constants {
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

    etna::ComputePipeline pipeline_;
    etna::Image image_;
    etna::Sampler sampler_;
};
