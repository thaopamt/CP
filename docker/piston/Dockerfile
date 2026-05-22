FROM ghcr.io/engineer-man/piston

# Copy init and patch scripts
COPY init-packages.js /piston/init-packages.js
COPY patch-cgroup.js /piston/patch-cgroup.js
COPY entrypoint.sh /piston/entrypoint.sh
RUN chmod +x /piston/entrypoint.sh

ENTRYPOINT ["/bin/sh", "/piston/entrypoint.sh"]
