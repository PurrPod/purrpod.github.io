# FAQ

## 1. Environment Deployment

**1. What prerequisites are required? How to verify?**
The following dependencies are required:
**Docker** (Docker Desktop is also required on Windows)
**uv**
**Node.js**
**Git**
Run the following commands; no errors means the installation is successful:
```
docker --version
uv --version
node --version
git --version
```

**2. Installation is slow, times out, or fails?**

Usually a network issue, especially when pulling Docker images. A stable network/VPN is required.

**3. Virtualization conflicts during deployment?** Docker relies on the host's virtualization support. Common issues:

- **Windows (WSL2 / Hyper-V)**: Docker Desktop requires hardware virtualization (VT-x / AMD-V) enabled in the BIOS. Many laptops have it disabled by default, and Docker will fail to start. Enable it in the BIOS.
- **VMware / VirtualBox conflicts**: Running other VM software on the host may conflict with Hyper-V / WSL2, causing blue screens or startup failures.
- **Nested Virtualization**: If PurrCat itself runs inside a VM (e.g., a cloud server or Parallels), nested virtualization support must be enabled, otherwise Docker containers cannot start.
- **Linux**: Native Docker support is best, with almost no conflicts. However, non-default container runtimes (such as containerd) may be incompatible with the sandbox initialization script.
